extends Node2D

@onready var limit = get_node("Limit")
@onready var interval = get_node("Interval")
@export var attack_dash: AnimatedSprite2D 

var is_pressed = false
var is_drag = false
var curPosition = Vector2.ZERO
var prevPosition = Vector2.ZERO
var gameOver = false

var hit_position: Vector2 = Vector2.ZERO
var hit_collider: Node = null

signal enemyCut(spriteNode: Area3D);

func _input(event):
	event = make_input_local(event)

	# Dokunmatik
	if event is InputEventScreenTouch:
		if event.pressed:
			on_pressed(event.position)
		else:
			on_released()

	elif event is InputEventScreenDrag:
		on_drag(event.position)

	# Fare (masaüstü)
	elif event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				on_pressed(event.position)
			else:
				on_released()

	elif event is InputEventMouseMotion and is_pressed:
		attack_dash.play()
		attack_dash.position = event.position
		attack_dash.visible = true
		on_drag(event.position)
	
	else:
		attack_dash.play()
		attack_dash.position = event.position
		attack_dash.visible = false


func on_pressed(position: Vector2):
	is_pressed = true
	prevPosition = position
	limit.start()
	interval.start()


func on_released():
	is_pressed = false
	is_drag = false
	limit.stop()
	interval.stop()
	prevPosition = Vector2.ZERO
	curPosition = Vector2.ZERO


func on_drag(position: Vector2):
	curPosition = position
	is_drag = true


func _on_Interval_timeout():
	prevPosition = curPosition


func _on_Limit_timeout():
	on_released()

func check_collision(point: Vector2):
	var space_state = get_world_2d().direct_space_state
	var query = PhysicsPointQueryParameters2D.new()
	query.position = point
	query.collide_with_areas = true
	query.collide_with_bodies = true
	query.exclude = [self]

	var result = space_state.intersect_point(query)
	if result.size() > 0:
		for r in result:
			var collider = r.collider
			if collider != self:
				print("Çarpışma oldu:", collider.name)
				# collider içinde CPUParticles2D var mı kontrol et
				var particle_node = collider.get_node_or_null("CPUParticles2D")
				if particle_node:
					# Partikülleri başlat

					## 1 saniye bekle (örneğin partiküllerin görünmesi için)
					#await get_tree().create_timer(1.0).timeout
#
					## Partikülleri durdur ve nesneyi sil
					#particle_node.emitting = false
					#make sprite2d invisible
					var sprite_node = collider.get_node_or_null("AnimatedSprite2D")
					if sprite_node.visible:
						particle_node.emitting = true
						
					
					if sprite_node:
						sprite_node.visible = false
						emit_signal("enemyCut", sprite_node.get_parent())

func _physics_process(delta):
	queue_redraw()
	if is_drag:
		check_collision(curPosition)

	if is_drag and curPosition != prevPosition and prevPosition != Vector2.ZERO and not gameOver:
		var space_state = get_world_2d().direct_space_state
		var params = PhysicsRayQueryParameters2D.new()
		params.from = to_global(prevPosition)
		params.to = to_global(curPosition)
		params.exclude = [self]

		var result = space_state.intersect_ray(params)

		if not result.is_empty():
			hit_position = result.position
			hit_collider = result.collider

			if hit_collider:
				print("Çarpıştı:", hit_collider.name)
				if hit_collider.has_method("cut"):
					hit_collider.cut()
		else:
			hit_position = Vector2.ZERO
			hit_collider = null


func _draw():
	if is_drag and curPosition != prevPosition and prevPosition != Vector2.ZERO and not gameOver:
		var base_color = Color(1, 0, 0)
		
		for i in range(-2, 3): 
			var offset = Vector2(0, i)
			draw_line(prevPosition + offset, curPosition + offset, base_color, 2)
			# Yönü hesapla
			var direction = curPosition.x - prevPosition.x
			
			# Eğer AttachDash bir AnimatedSprite2D veya Sprite2D ise:
			if direction > 0:
				self.get_parent().get_node("AttackDash").flip_h = false  # sağa gidiyor
			elif direction < 0:
				self.get_parent().get_node("AttackDash").flip_h = true  # sola gidiyor
		# 💥 Çarpma noktası
		if hit_position != Vector2.ZERO:
			
			draw_circle(to_local(hit_position), 6, Color(1, 1, 0))
