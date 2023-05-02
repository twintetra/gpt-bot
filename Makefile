build:
	docker build -t my-telegram-bot .
run:
	docker run -d --name my-telegram-bot-container my-telegram-bot
