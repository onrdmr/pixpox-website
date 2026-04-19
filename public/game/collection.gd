extends Node2D


var testArr = ["res://Videos/test1.png", "res://Videos/test2.png", "res://Videos/test3.png"]
var testId = 0
# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	testId = 0
	pass # Replace with function body.


# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta: float) -> void:
	pass


func _on_buy_button_button_down() -> void:
	var anim = $Buy
	anim.sprite_frames.set_animation_loop("default", false)
	anim.play("default")


func _on_buy_animation_finished() -> void:
	get_tree().change_scene_to_file("res://game.tscn")
	
	pass # Replace with function body.


func _on_sell_button_button_down() -> void:
	var anim = $Sell
	anim.sprite_frames.set_animation_loop("default", false)
	anim.play("default")

	
	pass # Replace with function body.



func _on_sell_animation_finished() -> void:
	if get_tree().change_scene_to_file("res://Scenes/menu.tscn") != OK:
		print ("Error changing scene to Menu")
	
	pass # Replace with function body.


func _on_next_button_button_down() -> void:
	$AttackDash.play()
	$VideoCutParticle.emitting = true
	$VideoImage.texture = null
	testId+=1
	# Wait for 5 seconds
	await get_tree().create_timer(1.0).timeout

	# Load the new image
	var new_texture = load(testArr[testId%len(testArr)])
	if new_texture:
		$VideoImage.texture = new_texture
		$AttackDash.stop()

	else:
		push_warning("Could not load image at given path.")

	pass # Optional


func _on_previous_button_button_down() -> void:
	$AttackDash.play()
	$VideoCutParticle.emitting = true
	$VideoImage.texture = null
	testId-=1
	# Wait for 5 seconds
	await get_tree().create_timer(1.0).timeout

	# Load the new image
	var new_texture = load(testArr[testId%len(testArr)])
	if new_texture:
		$VideoImage.texture = new_texture
		$AttackDash.stop()
		
	else:
		push_warning("Could not load image at given path.")

	pass # Optional
