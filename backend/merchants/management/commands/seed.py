from django.core.management.base import BaseCommand
from django.db import transaction

from merchants.models import Merchant, BankAccount
from ledger.models import LedgerEntry


SEED_DATA = [
    {
        "name": "Aakash Design Studio",
        "email": "aakash@designstudio.in",
        "bank": {
            "account_number": "1234567890123456",
            "ifsc_code": "HDFC0001234",
            "account_holder_name": "Aakash Sharma",
        },
        "credits": [
            {"amount_paise": 500_000, "description": "USD 600 client payment — Figma project"},
            {"amount_paise": 250_000, "description": "USD 300 client payment — logo design"},
            {"amount_paise": 175_000, "description": "USD 210 client payment — brand kit"},
        ],
    },
    {
        "name": "Priya Tech Solutions",
        "email": "priya@priyatech.io",
        "bank": {
            "account_number": "9876543210987654",
            "ifsc_code": "ICIC0009876",
            "account_holder_name": "Priya Nair",
        },
        "credits": [
            {"amount_paise": 1_200_000, "description": "USD 1440 — React dashboard project"},
            {"amount_paise": 800_000,  "description": "USD 960 — API integration work"},
        ],
    },
    {
        "name": "Rohan Writes",
        "email": "rohan@rohanwrites.com",
        "bank": {
            "account_number": "1122334455667788",
            "ifsc_code": "SBIN0001122",
            "account_holder_name": "Rohan Mehta",
        },
        "credits": [
            {"amount_paise": 83_000,  "description": "USD 100 — blog post batch #1"},
            {"amount_paise": 166_000, "description": "USD 200 — technical writing project"},
            {"amount_paise": 41_500,  "description": "USD 50 — editing pass"},
        ],
    },
]


class Command(BaseCommand):
    help = "Seed the database with test merchants and credit history"

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        with transaction.atomic():
            for data in SEED_DATA:
                merchant, created = Merchant.objects.get_or_create(
                    email=data["email"],
                    defaults={"name": data["name"]},
                )
                action = "Created" if created else "Found"
                self.stdout.write(f"  {action} merchant: {merchant.name}")

                bank, _ = BankAccount.objects.get_or_create(
                    merchant=merchant,
                    account_number=data["bank"]["account_number"],
                    defaults={
                        "ifsc_code": data["bank"]["ifsc_code"],
                        "account_holder_name": data["bank"]["account_holder_name"],
                        "is_primary": True,
                    },
                )

                if created:
                    for credit in data["credits"]:
                        LedgerEntry.objects.create(
                            merchant=merchant,
                            entry_type=LedgerEntry.CREDIT,
                            amount_paise=credit["amount_paise"],
                            description=credit["description"],
                        )
                    total = sum(c["amount_paise"] for c in data["credits"])
                    self.stdout.write(
                        f"    Added {len(data['credits'])} credits "
                        f"(total ₹{total/100:.2f})"
                    )

        self.stdout.write(self.style.SUCCESS("\nDone! Run `python manage.py runserver` to start."))
        self.stdout.write("\nMerchant summary:")
        for m in Merchant.objects.prefetch_related("bank_accounts", "ledger_entries"):
            credits = sum(
                e.amount_paise for e in m.ledger_entries.all()
                if e.entry_type == LedgerEntry.CREDIT
            )
            ba = m.bank_accounts.first()
            self.stdout.write(
                f"  {m.name} | balance ₹{credits/100:.2f} | "
                f"bank: {ba.account_number[-4:] if ba else 'N/A'} | "
                f"merchant_id: {m.id}"
            )