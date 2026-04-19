extends VideoStreamPlayer

@export var beat_json_path: String = "res://beats/song_beats.json"
@export var test_scene: PackedScene = preload("res://test.tscn")
@export var spawn_area: Rect2 = Rect2(Vector2(0, 0), Vector2(190, 320)) # tam ekran
@export var lifetime: float = Global.lifetime # saniye

var max_combo = 0
var great = 0
var good = 0
var okay = 0
var missed = 0

var current_combo = 1
var current_great = 1
var current_good = 1
var current_okay = 1

signal session_loaded()

var beats: Array[float] = []
var current_beat_index: int = 0

var current_video_index: int = 0
var enemy_list: Array = []


func load_videos_and_beatmaps() -> void:
	var http = HTTPRequest.new()
	add_child(http)
	# eski api
	#http.connect("request_completed", Callable(self, "_on_videos_and_beatmaps_received"))
	#http.request("http://127.0.0.1:8000/videos")

	# yeni api
	http.connect("request_completed", Callable(self, "_on_videos_and_beatmaps_received_latest"))
	http.request("http://localhost:5173/api/videos?sort=random")

func _on_videos_and_beatmaps_received_latest(result, response_code, headers, body):
	if response_code != 200:
		push_error("Video ve beatmap listesi alınamadı.")
		return

	var json = JSON.new()
	if json.parse(body.get_string_from_utf8()) != OK:
		push_error("JSON parse hatası (FastAPI)")
		return

	videos.clear()
	beatmaps.clear()

	for item in json.data:
		video_urls.append(item["video_url"])
		beatmap_urls.append(item["beatmap_url"])

	print("✅ Videos ve beatmaps güncellendi:", videos.size())
	_download_video_and_beatmap(current_video_index)


func _on_videos_and_beatmaps_received(result, response_code, headers, body):
	if response_code != 200:
		push_error("Video ve beatmap listesi alınamadı.")
		return

	var json = JSON.new()
	if json.parse(body.get_string_from_utf8()) != OK:
		push_error("JSON parse hatası (FastAPI)")
		return

	videos.clear()
	beatmaps.clear()

	for item in json.data:
		video_urls.append(item["video_url"])
		beatmap_urls.append(item["beatmap_url"])

	print("✅ Videos ve beatmaps güncellendi:", videos.size())
	_download_video_and_beatmap(current_video_index)

func _download_video_and_beatmap(index: int) -> void:
	if index >= video_urls.size():
		print("Tüm videolar işlendi.")
		emit_signal("session_loaded")
		var random_idx = randi() % videos.size();
		var pick = videos[random_idx]
		beat_json_path = beatmaps[random_idx]

		var stream = load(pick)
		self.stream = stream
		self.play()

		_load_beats()
		current_beat_index = 0
		return

	var pick_video = video_urls[index]
	var pick_beatmap = beatmap_urls[index]

	# Video indir
	var http_video = HTTPRequest.new()
	add_child(http_video)
	http_video.connect("request_completed", Callable(self, "_on_video_downloaded").bind(index))
	http_video.request(pick_video)

func _on_video_downloaded(result, response_code, headers, body, index):
	if response_code != 200:
		push_error("Video indirilemedi:", videos[index])
		return

	var video_path = "user://video_%d.ogv" % index
	var file = FileAccess.open(video_path, FileAccess.WRITE)
	file.store_buffer(body)
	file.close()
	print("✅ Video kaydedildi:", video_path)
	videos.append(video_path)

	# Beatmap indir
	var http_beat = HTTPRequest.new()
	add_child(http_beat)
	http_beat.connect("request_completed", Callable(self, "_on_beatmap_downloaded").bind(index))
	http_beat.request(beatmap_urls[index])

func _on_beatmap_downloaded(result, response_code, headers, body, index):
	if response_code != 200:
		push_error("Beatmap indirilemedi:", beatmaps[index])
		return

	var beatmap_path = "user://beatmap_%d.json" % index
	var file = FileAccess.open(beatmap_path, FileAccess.WRITE)
	file.store_buffer(body)
	file.close()
	print("✅ Beatmap kaydedildi:", beatmap_path)

	beatmaps.append(beatmap_path)
	# İstersen burada videoyu oynatabilir veya sıradaki videoya geçebilirsin
	current_video_index += 1
	_download_video_and_beatmap(current_video_index)


var videos = [
	#"res://Videos/test.ogv",
	#"res://Videos/katseye1.ogv",
	#"res://Videos/katseye_gnarly.ogv",
	#"res://Videos/content_warning_pixelart.ogv"
]

var beatmaps = [
	#"res://beats/song_beats.json",
	#"res://beats/katseye1_beats.json",
	#"res://beats/katseye_gnarly_beats.json",
	#"res://beats/content_warning_pixelart_beats.json"
]

var video_urls = [
	#"res://Videos/test.ogv",
	#"res://Videos/katseye1.ogv",
	#"res://Videos/katseye_gnarly.ogv",
	#"res://Videos/content_warning_pixelart.ogv"
]

var beatmap_urls = [
	#"res://beats/song_beats.json",
	#"res://beats/katseye1_beats.json",
	#"res://beats/katseye_gnarly_beats.json",
	#"res://beats/content_warning_pixelart_beats.json"
]

func _ready() -> void:
	Global.score = 0
	Global.combo = 0
	Global.great = 0
	Global.good = 0
	Global.okay = 0
	Global.missed = 0
	Global.grade = "NA"
	
	
	load_videos_and_beatmaps() # bana bu metodu yaz beatmaps ve cideosu değiştirsin
	
	randomize()
	
	

func _load_beats() -> void:
	var f := FileAccess.open(beat_json_path, FileAccess.READ)
	if not f:
		push_error("Beat file not found: %s" % beat_json_path)
		return
	var content := f.get_as_text()
	f.close()

	var parsed = JSON.parse_string(content)
	if parsed == null:
		push_error("Failed to parse JSON")
		return

	# cast result into Array[float]
	var arr: Array = parsed
	for value in arr:
		beats.append(float(value))

func _process(delta: float) -> void:
	if beats.is_empty():
		return
	
	if current_beat_index >= beats.size():
		Global.max_score = beats.size() * 40

		return

	var pos := get_stream_position() # video position (seconds)
	if pos >= beats[current_beat_index]:
		_spawn_test()
		current_beat_index += 1

func _spawn_test() -> void:
	var instance := test_scene.instantiate()

	# parent olarak VideoStreamPlayer'ın parent'ını kullan (veya current_scene)
	var parent := get_parent()
	if not parent:
		parent = get_tree().current_scene
	parent.add_child(instance)

	# random pozisyon ayarla
	var rx := randf_range(spawn_area.position.x, spawn_area.position.x + spawn_area.size.x)
	var ry := randf_range(spawn_area.position.y, spawn_area.position.y + spawn_area.size.y)
	if instance is Node2D:
		instance.position = Vector2(rx, ry)
	
	enemy_list.append(instance)
	# Fade ve yok olma
	if instance is CanvasItem:
		instance.modulate = Color(1, 1, 1, 1)
		var tw := instance.create_tween()
		tw.tween_property(instance, "modulate", Color(1, 1, 1, 0), lifetime)
	
	
	await get_tree().create_timer(lifetime).timeout
	if instance and instance.is_inside_tree():
		var i = 0
		for enemy in enemy_list:
			print("life end {0} {1}".format([enemy.get_instance_id(), instance.get_instance_id()]))
			if (enemy.get_instance_id() == instance.get_instance_id()):
				enemy_list.remove_at(i)
				var status_label = instance.get_node("Status") as Label
				status_label.text = "Missed"
				current_combo = 1
				Global.missed += 1
				
			i+=1
		
		instance.queue_free()


func _on_finished() -> void:
	get_tree().change_scene_to_file("res://Scenes/end.tscn")
	pass # Replace with function body.


func _on_input_processor_enemy_cut(circleNode:Area2D) -> void:
	circleNode.get_instance_id()
	
	var i = 0
	for enemy in enemy_list:
		print("test {0} {1}".format([enemy.get_instance_id(), circleNode.get_instance_id()]))
		if (enemy.get_instance_id() == circleNode.get_instance_id()):
			var comboPosition = randi_range(1, 4)
			var combo_label = circleNode.get_node("Combo" + str(comboPosition)) as Label
			if combo_label and circleNode.elapsed_time <= 0.5:
				combo_label.text = str(current_combo) + " Combo!"
				var status_label = circleNode.get_node("Status") as Label
				status_label.text = "Perfect"
				current_great += 1
				
				if (current_great > great):
					Global.great = current_great 
				if (current_good > good):
					Global.good = current_good
				if (current_okay > okay):
					Global.okay = current_okay
				
				current_combo += 1
				
				if (current_combo > Global.combo):
					Global.combo = current_combo
				
				current_great += 1
				
			elif combo_label and circleNode.elapsed_time > 0.5 and circleNode.elapsed_time <= 1:
				combo_label.text = str(current_combo) + " Combo!"   # tamamen değiştirir
				
				var status_label = circleNode.get_node("Status") as Label
				status_label.text = "Good"
				
				current_combo += 1
				current_good += 1
				
				
				if (current_great > great):
					Global.great = current_great 
				if (current_good > good):
					Global.good = current_good
				if (current_okay > okay):
					Global.okay = current_okay

				
				if (current_combo > Global.combo):
					Global.combo = current_combo
				
				
			elif combo_label and circleNode.elapsed_time > 1 and circleNode.elapsed_time <= 2:
				combo_label.text = str(current_combo) + " Combo!"   # tamamen değiştirir
				
				var status_label = circleNode.get_node("Status") as Label
				status_label.text = "Okay"
				
				current_combo += 1
				current_okay+= 1
				
				
				
				if (current_great > great):
					Global.great = current_great 
				if (current_good > good):
					Global.good = current_good
				if (current_okay > okay):
					Global.okay = current_okay

				
				
				if (current_combo > Global.combo):
					Global.combo = current_combo
				
				
			
			if combo_label and  circleNode.elapsed_time > 2:
				var status_label = circleNode.get_node("Status") as Label
				status_label.text = "Missed"
				current_combo = 1
				

				Global.missed = Global.missed +1
				
				# veya ekleme yapmak istersen:
				# combo_label.text += " Combo!"
			enemy_list.remove_at(i)
		i+=1
	
	pass # Replace with function body.
