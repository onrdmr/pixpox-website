
extends Node2D

@export var cell_scene : PackedScene
var row_count : int = 70
var column_count : int = 40 
var cell_width: int = 5

var cell_matrix: Array = []
var previous_cell_states: Array = []

# AFTER (Godot 4)
@onready var start_button = $Start_Button
@onready var volume_slider = $HSlider
@onready var audio_button = $TextureButton


func _ready():
	var rng = RandomNumberGenerator.new()
	for column in range(column_count):
		cell_matrix.push_back([])
		previous_cell_states.push_back([])
		for row in range(row_count):
			var cell = cell_scene.instantiate()
			self.add_child(cell)
			cell.position = Vector2(column * cell_width, row * cell_width)
			if rng.randi_range(0,1) or is_edge(column, row):
				cell.visible = false
				previous_cell_states[column].push_back(false)
			else:
				previous_cell_states[column].push_back(true)
			cell_matrix[column].push_back(cell)
	pass




func is_edge(column, row):
	return row == 0 or column == 0 or row == row_count-1 or column == column_count -1

func get_count_of_alive_neighbours(column, row):
	var count = 0
	for x in range(-1, 2):
		for y in range(-1, 2):
			if not (x == 0 and y == 0):
				if previous_cell_states[column + x][row + y]:
					count += 1
	return count

func get_next_state(column, row):
	var current = previous_cell_states[column][row]
	var neighbours_alive = get_count_of_alive_neighbours(column, row)
	
	if current == true:
		# alive
		if neighbours_alive > 3:
			return false
		elif neighbours_alive < 2:
			return false
	else:
		# dead
		if neighbours_alive == 3:
			return true
	return current
var painting = false


func _toggle_cell(pos: Vector2):
	var column = int(pos.x / cell_width)
	var row = int(pos.y / cell_width)

	if column >= 0 and column < column_count and row >= 0 and row < row_count:
		var cell = cell_matrix[column][row]
		cell.visible = not cell.visible
		previous_cell_states[column][row] = cell.visible
		
		
func _input(event):
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				painting = true
				_toggle_cell(event.position)
			else:
				painting = false
	elif event is InputEventMouseMotion and painting:
		_toggle_cell(event.position)



func _process(delta):
	# save each cells state to the old state array
	for column in range(column_count):
		for row in range(row_count):
			previous_cell_states[column][row] = cell_matrix[column][row].visible
	
	# update current state
	for column in range(column_count):
		for row in range(row_count):
			if !is_edge(column, row):
				cell_matrix[column][row].visible = get_next_state(column, row)
	pass


# -----------------------------
# Ana menü butonları
# -----------------------------
#func _on_Start_Button_button_down():
	#if get_tree().change_scene("res://node_2d.tscn") != OK:
		#print("Error changing scene to Game")
func _on_Start_Button_button_down() -> void:
	get_tree().change_scene_to_file("res://game.tscn")

func _on_HSlider_value_changed(value):
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"),
		linear_to_db(value))

func _on_TextureButton_pressed():
	audio_button.get_node("AudioStreamPlayer").play()
	await get_tree().create_timer(1.0).timeout

	get_tree().change_scene_to_file("res://Collection.tscn")


func _on_test_pressed() -> void:
	audio_button.get_node("AudioStreamPlayer").play()
