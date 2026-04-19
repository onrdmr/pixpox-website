extends Node2D



func _ready():
	Global.score = Global.combo * 30 + Global.great * 5 + Global.good * 3 + Global.okay * 1 - Global.missed * 40 
	
	if Global.score > Global.max_score:
		Global.grade = "S+"	
	elif Global.score > (Global.max_score * (26.0/27.0)):
		Global.grade = "S"
	elif Global.score > (Global.max_score * (24.0/27.0)):
		Global.grade = "A+"
	elif Global.score > (Global.max_score * (22.0/27.0)):
		Global.grade = "A"
	elif Global.score > (Global.max_score * (20.0/27.0)):
		Global.grade = "A-"
	elif Global.score > (Global.max_score * (18.0/27.0)):
		Global.grade = "B+"
	elif Global.score > (Global.max_score * (16.0/27.0)):
		Global.grade = "B"
	elif Global.score > (Global.max_score * (14.0/27.0)):
		Global.grade = "B-"
	elif Global.score > (Global.max_score * (12.0/27.0)):
		Global.grade = "C+"
	elif Global.score > (Global.max_score * (10.0/27.0)):
		Global.grade = "C"
	elif Global.score > (Global.max_score * (8.0/27.0)):
		Global.grade = "C-"
	elif Global.score > (Global.max_score * (6.0/27.0)):
		Global.grade = "D+"
	elif Global.score > (Global.max_score * (4.0/27.0)):
		Global.grade = "D"
	elif Global.score > (Global.max_score * (2.0/27.0)):
		Global.grade = "D-"
	else:
		Global.grade = "F"
	
	$GradeNumber.text = Global.grade
	$ScoreNumber.text = str(Global.score)
	$ComboNumber.text = str(Global.combo)
	$GreatNumber.text = str(Global.great)
	$GoodNumber.text = str(Global.good)
	$OkayNumber.text = str(Global.okay)
	$MissedNumber.text = str(Global.missed)
	

func _on_PlayAgain_pressed():
	if get_tree().change_scene_to_file("res://game.tscn") != OK:
			print ("Error changing scene to Game")


func _on_BackToMenu_pressed():
	if get_tree().change_scene_to_file("res://Scenes/menu.tscn") != OK:
			print ("Error changing scene to Menu")
