extends Node2D


func _on_video_stream_player_session_loaded() -> void:
	queue_free()
	pass # Replace with function body.
var quotes = []

func _ready() -> void:
	load_quotes()
	show_random_quote()


func load_quotes() -> void:
	var file_path = "res://quotes.json"
	if not FileAccess.file_exists(file_path):
		push_error("quotes.json bulunamadı!")
		return

	var file = FileAccess.open(file_path, FileAccess.READ)
	var content = file.get_as_text()
	file.close()

	var result = JSON.parse_string(content)
	if result == null:
		push_error("quotes.json okunamadı veya geçersiz JSON.")
		return

	quotes = result


func show_random_quote() -> void:
	if quotes.is_empty():
		return

	var rng = RandomNumberGenerator.new()
	var quote_obj = quotes[rng.randi_range(0, quotes.size() - 1)]

	# Label'ları dolduralım
	$RichTextLabel.text = '' + quote_obj["quote"] + ''
	$Label.text = quote_obj["character"] + " — " + quote_obj["show"]
