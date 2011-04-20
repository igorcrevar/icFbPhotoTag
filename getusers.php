<?php
$user1 = new stdClass;
$user1->id = 100;
$user1->name = 'John Lennon';
$user2 = new stdClass;
$user2->id = 102;
$user2->name = 'Paul McCartney';
$user3 = new stdClass;
$user3->id = 104;
$user3->name = 'George Harrison';
$user4 = new stdClass;
$user4->id = 1046;
$user4->name = 'Ringo Starr';
$user5 = new stdClass;
$user5->id = 1009;
$user5->name = 'Marian Gold';
$user6 = new stdClass;
$user6->id = 10287;
$user6->name = 'Frank Mertens';
$user7 = new stdClass;
$user7->id = 1047;
$user7->name = 'Bernhard Lloyd';
$user8 = new stdClass;
$user8->id = 104634;
$user8->name = 'Ricky Echolette';
$users = array($user1,$user2,$user3,$user4,$user5,$user6,$user7,$user8);
echo '([';
$cnt = count($users);
$i = 0;
foreach ($users as $user){
	echo '{';
	echo 'id:'.$user->id;
	echo ', ';
	echo 'title:\''.$user->name."'";
	echo '}';
	++$i;
	if ( $i < $cnt ) echo ', ';
}
echo '])';