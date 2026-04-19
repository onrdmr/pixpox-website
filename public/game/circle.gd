extends Area2D

@export var lifetime = Global.lifetime
@export var elapsed_time := 0.0

func _ready():
	add_to_group("test")
	$AnimatedSprite2D.play()
	set_process(true)

func _process(delta):
	elapsed_time += delta

	# Fade veya yok olma için kalan süreyi takip et
	var progress = clamp(elapsed_time / lifetime, 0, 1)
	modulate.a = 1.0 - progress  # saydamlaşsın
	#print("Circle,", get_instance_id() ,progress)


func cut():
	print("Kesildi:", name)
	$CPUParticles2D.emitting = true
