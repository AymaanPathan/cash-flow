cd backend

# create virtual env
python -m venv venv
source venv/bin/activate   # mac/linux
venv\Scripts\activate      # windows

# install deps
pip install -r requirements.txt

# setup db
python manage.py migrate

# seed data (if added)
python manage.py loaddata seed.json

# run server
daphne -p 8000 core.asgi:application

celery -A core worker --loglevel=info --pool=solo