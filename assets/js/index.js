
function readyPage(){
	return new Promise(done=>{
		var docReday = new Promise(d=>$(d));
		var jsqlReday = new Promise(d=>jSQL.load(()=>{console.log('done'); done()}));
		Promise.all([docReday,jsqlReday]).then(done);
	});
}

readyPage().then(()=>{
	initDB().then(setState);
});

$(document).on('click', '.new_instrument', function(e){
	e.preventDefault();
	console.log('todo');
});

$(document).on('click', '.change_instrument', function(e){
	e.preventDefault();
	var inst = decodeURIComponent($(this).data('instrument'));
	setInstrument(inst);
});

$(document).on('click', '.open_page', function(e){
	e.preventDefault();
	var page = $(this).data('page');
	openPage(page);
});

function openPage(page){
	$(".page").slideUp('fast', ()=>$("#"+page+"_page").slideDown());
	jSQL.query("UPDATE `state` SET `tab` = ?").execute([page]);
	jSQL.commit();
}

function setInstrument(name){
	getInstrument(name).then(inst=>{
		if(!inst) return;
		$(".current_instrument").html(name);
		jSQL.query("UPDATE `state` SET `instrument` = ?").execute([name]); 
		jSQL.commit();
	});
}

function setState(){
	var state = jSQL.query("SELECT * FROM `state`").execute().fetch("ASSOC");
	$("#instruments_dropdown").empty();
	var instruments = jSQL.query("SELECT `name` FROM `instruments`").execute().fetchAll("ASSOC");
	instruments.forEach(inst=>$("#instruments_dropdown").append('<li><a href="#" class="change_instrument" data-instrument="'+encodeURIComponent(inst.name)+'">'+inst.name+'</li>'));
	$("#instruments_dropdown").append('<li><a href="#" class="new_instrument"><span class="glyphicon glyphicon-edit"></span> New Instrument</a></li>');
	//setInstrument(state.instrument);
	openPage(state.tab);
}

function getInstrument(name){
	return new Promise(done=>{
		setTimeout(()=>{
			var p = name ? new Promise(d=>d(name)) : new Promise(d=>setTimeout(()=>done(jSQL.query("SELECT `instrument` FROM `state`").execute().fetch("ASSOC").instrument),50));
			p.then(n=>done(jSQL.query("SELECT * FROM `instruments` WHERE `name` = ?").execute([n]).fetch("ASSOC")));
		},50);
	});
}

function initDB(){
	return new Promise(ddd=>{
		jSQL.query("-- Generated with jSQL Devel on Friday, June 8th 2018, 2:37pm \n\
		CREATE TABLE IF NOT EXISTS `state` (\n\
			`instrument` VARCHAR(100) NOT NULL,\n\
			`tab` ENUM(\"scales\", \"chords\", \"home\") NOT NULL DEFAULT \"scales\",\n\
		)").execute();
		if(!jSQL.query("SELECT * FROM `state`").execute().fetchAll("ASSOC").length){ 
			console.log("Creating new state")
			jSQL.query("INSERT INTO `state` VALUES (?, ?)").execute(['Guitar (Standard)', 'home']);
		}
		jSQL.query("-- Generated with jSQL Devel on Friday, June 8th 2018, 1:14pm \n\
		CREATE TABLE IF NOT EXISTS `instruments` (\n\
			`name` VARCHAR(100) NOT NULL,\n\
			`frets` NUMERIC NOT NULL,\n\
			`strings` NUMERIC NOT NULL,\n\
			`tuning` ARRAY NOT NULL,\n\
			`doubleFretMarkers` ARRAY NOT NULL,\n\
			`singleFretMarkers` ARRAY NOT NULL\n\
		)").execute();
		jSQL.commit();

		var promises = [];

		promises.push(new Promise(done=>{
			getInstrument('Guitar (Standard)').then(inst=>{
				if(inst) return done();
				jSQL.query("INSERT INTO `instruments` VALUES (?, ?, ?, ? ,?, ?)").execute([
					'Guitar (Standard)', // name
					24, // frets
					6, // strings
					["E","B","G","D","A","E"], // tuning
					[12,24], // double fret markers
					[3,5,7,9,15,17,19,21] // single fret markers
				]);
				jSQL.commit();
				done();
			});
		}));

		promises.push(new Promise(done=>{
			getInstrument('Bass (Standard)').then(inst=>{
				if(inst) return done();
				jSQL.query("INSERT INTO `instruments` VALUES (?, ?, ?, ?, ?, ?)").execute([
					'Bass (Standard)', // name
					24, // frets
					4, // strings
					["G","D","A","E"], // tuning
					[12,24], // double fret markers
					[3,5,7,9,15,17,19,21] // single fret markers
				]);
				jSQL.commit();
				done();
			});
		}));
		
		promises.push(new Promise(done=>{
			getInstrument('Ukulele (Standard)').then(inst=>{
				if(inst) return done();
				jSQL.query("INSERT INTO `instruments` VALUES (?, ?, ?, ?, ?, ?)").execute([
					'Ukulele (Standard)', // name
					18, // frets
					4, // strings
					["A","E","C","G"], // tuning
					[12], // double fret markers
					[5,7,10,14] // single fret markers
				]);
				jSQL.commit();
				done();
			});
		}));
		
		promises.push(new Promise(done=>{
			getInstrument('Mandolin (Standard)').then(inst=>{
				if(inst) return done();
				jSQL.query("INSERT INTO `instruments` VALUES (?, ?, ?, ?, ?, ?)").execute([
					'Mandolin (Standard)', // name
					20, // frets
					4, // strings
					["E","A","D","G"], // tuning
					[12], // double fret markers
					[3,5,7,10,15] // single fret markers
				]);
				jSQL.commit();
				done();
			});
		}));

		Promise.all(promises).then(()=>{
			jSQL.commit();
			ddd();
		});
		
	});
	
}