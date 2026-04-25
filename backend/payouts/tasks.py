import random
import logging
from datetime import timedelta

from celery import shared_task
from django.db import transaction, OperationalError
from django.utils import timezone

from .models import Payout
from .services import transition_payout, InvalidTransitionError

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 3
STUCK_THRESHOLD_SECONDS = 30  

BACKOFF_DELAYS = {1: 10, 2: 30, 3: 90}


def _simulate_bank_outcome() -> str:
    """
    Simulate bank settlement:
      70% → completed
      20% → failed
      10% → hang (stays in processing — caught by retry_stuck_payouts)
    """
    roll = random.random()
    if roll < 0.70:
        return "completed"
    elif roll < 0.90:
        return "failed"
    else:
        return "hang"


@shared_task(bind=True, max_retries=0)  
def process_pending_payout(self, payout_id: str):
    logger.info(f"Processing payout {payout_id}")

    try:
        with transaction.atomic():
            try:
                payout = Payout.objects.select_for_update(nowait=True).get(pk=payout_id)
            except OperationalError:
                logger.warning(f"Payout {payout_id} is locked by another worker, skipping.")
                return
            except Payout.DoesNotExist:
                logger.error(f"Payout {payout_id} not found.")
                return

            if payout.status != Payout.PENDING:
                logger.info(f"Payout {payout_id} is in state {payout.status!r}, skipping.")
                return

            payout.attempt_count += 1
            payout.save(update_fields=["attempt_count", "updated_at"])

            transition_payout(payout, Payout.PROCESSING)

    except InvalidTransitionError as e:
        logger.error(f"State machine error on payout {payout_id}: {e}")
        return

    outcome = _simulate_bank_outcome()
    logger.info(f"Payout {payout_id} bank outcome: {outcome}")

    if outcome == "hang":
        logger.info(f"Payout {payout_id} hung in processing, will be retried by periodic task.")
        return


    try:
        with transaction.atomic():
            payout = Payout.objects.select_for_update(nowait=True).get(pk=payout_id)

            if outcome == "completed":
                transition_payout(payout, Payout.COMPLETED)
                logger.info(f"Payout {payout_id} completed successfully.")
            elif outcome == "failed":
                _fail_payout(payout, reason="Bank rejected the transaction.")

    except (OperationalError, InvalidTransitionError) as e:
        logger.error(f"Error settling payout {payout_id}: {e}")


def _fail_payout(payout: Payout, reason: str):
    transition_payout(payout, Payout.FAILED, failure_reason=reason)
    logger.info(f"Payout {payout.id} failed: {reason}. Funds released.")


@shared_task
def retry_stuck_payouts():
    cutoff = timezone.now() - timedelta(seconds=STUCK_THRESHOLD_SECONDS)

    stuck_payouts = Payout.objects.filter(
        status=Payout.PROCESSING,
        processing_started_at__lt=cutoff,
    ).values_list("id", flat=True)

    for payout_id in stuck_payouts:
        logger.info(f"Found stuck payout {payout_id}, attempting recovery.")

        try:
            with transaction.atomic():
                payout = Payout.objects.select_for_update(nowait=True).get(pk=payout_id)

                if payout.status != Payout.PROCESSING:
                    continue

                if payout.attempt_count >= MAX_ATTEMPTS:
                    _fail_payout(payout, reason=f"Exceeded max retry attempts ({MAX_ATTEMPTS}).")
                else:
                    payout.status = Payout.PENDING
                    payout.processing_started_at = None
                    payout.save(update_fields=["status", "processing_started_at", "updated_at"])

                    delay = BACKOFF_DELAYS.get(payout.attempt_count, 90)
                    process_pending_payout.apply_async(
                        args=[str(payout_id)], countdown=delay
                    )
                    logger.info(
                        f"Payout {payout_id} re-queued (attempt {payout.attempt_count}) "
                        f"with {delay}s delay."
                    )

        except OperationalError:
            logger.warning(f"Payout {payout_id} locked during retry scan, skipping.")
        except Payout.DoesNotExist:
            logger.warning(f"Payout {payout_id} disappeared during retry scan.")