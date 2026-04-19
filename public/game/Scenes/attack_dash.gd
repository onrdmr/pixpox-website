extends AnimatedSprite2D

@export var sellCPUParticles2D : CPUParticles2D
@export var buyCPUParticles2D : CPUParticles2D
@export var buyAnimatedSprite2D : AnimatedSprite2D
@export var sellAnimatedSprite2D : AnimatedSprite2D

# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	pass # Replace with function body.


# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta: float) -> void:
	pass


func _on_buy_button_button_down() -> void:
	

	var old_position = Vector2(173, 24)
	var new_position = Vector2(143, 25)
	
	var tween = create_tween()

	# 1. Karakteri kaybolma efekti (fade-out)
	tween.tween_property(self, "modulate:a", 0.0, 0.4)

	# 2. Kaybolduktan sonra yeni konuma ışınla
	tween.tween_callback(func ():
		self.position = new_position
	)

	# 3. Görünür hale gelme (fade-in)
	tween.tween_property(self, "modulate:a", 1.0, 0.4)

	# 4. Fade-in bittikten sonra animasyonu oynat
	tween.tween_callback(func (): 
		self.play() # Partikülleri başlat
		sellCPUParticles2D.emitting = true
		sellAnimatedSprite2D.visible = false
		buyAnimatedSprite2D.play())


func _on_sell_button_button_down() -> void:

	var old_position = Vector2(173, 24)
	var new_position = Vector2(40, 25)
	
	var tween = create_tween()

	# 1. Karakteri kaybolma efekti (fade-out)
	tween.tween_property(self, "modulate:a", 0.0, 0.4)

	# 2. Kaybolduktan sonra yeni konuma ışınla
	tween.tween_callback(func ():
		self.position = new_position
	)

	# 3. Görünür hale gelme (fade-in)
	tween.tween_property(self, "modulate:a", 1.0, 0.4)

	# 4. Fade-in bittikten sonra animasyonu oynat
	tween.tween_callback(func (): 
		self.flip_h = false
		self.play() # Partikülleri başlat
		buyCPUParticles2D.emitting = true
		buyAnimatedSprite2D.visible = false
		sellAnimatedSprite2D.play())
