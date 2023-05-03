build:
	docker build -t gpt-bot .
run:
	docker run -d --name gpt-bot-container gpt-bot
