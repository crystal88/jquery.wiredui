function debug(str) {
	console.log(str);
}

test("trim test", function() {
	same(new String(" a ").replace(/\s+$/, '').replace(/^\s+/, ''), "a")
})



module("statement tags");
/**
test("output tag test", function() {
	var data = $.observable({
		name: 'bence',
		email: 'crystal@cyclonephp.com'
	})
	$('#outputtest').wiredui( data );
	same($('#outputtest .name :first').html(), 'bence', "initial name");
	same($('#outputtest .email :first').html(), 'crystal@cyclonephp.com', "initial email");
	data().name('crystal');
	
	same($('#outputtest .name :first').html(), 'crystal', "value change handled properly");
})
/**
test("if statement", function() {
	var data = $.observable({
		name: "bence",
		hide: false
	});
	$("#iftest").wiredui( data );

	same($('#uif :first').html(), 'bence');

	data().name('bence2');
	same($('#uif :first').html(), 'bence2');
	data().hide(true);
	same( $("#iftest :first").html(), '', 'condition dependency update works');
});

/**
test("if-elseif-else tags", function() {
	var data = $.observable({user: {
		name: "bence",
		email: "crystal@cyclonephp.com",
		age: 23,
		render: 'name'
	}});
	$("#ifelseiftest").wiredui( data );
	same( $("#ifelseiftest .name :first").html(), 'bence');
	data().user().name("crystal");
	same( $("#ifelseiftest .name :first").html(), 'crystal');
	data().user().render('email');
	same( $("#ifelseiftest .email :first").html(), 'crystal@cyclonephp.com');
	data().user().render('both');
	var bothCnt = $('#ifelseiftest .both');
	same(bothCnt.find('.both-name :first').html(), 'crystal', "both-name rendered");
	same(bothCnt.find('.both-email :first').html(), 'crystal@cyclonephp.com', "both-email rendered");
});
/**


test("each statement", function() {
	var data = $.observable({
		arr: ['a', 'b', 'c'],
		glob: {
			name: 'bence'
		}
	});
	$('#eachtest').wiredui( data );
	same( $('#eachtest .each').length, 3, "iteration count is correct")
	
	data().arr([ 'a', 'b', 'c']);
	
	data().glob().name('crystal');
});
/**/
