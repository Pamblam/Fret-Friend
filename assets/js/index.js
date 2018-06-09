
var DB = {};
$(()=>{
	$("#new_instrument_modal").modal({show: false, backdrop: 'static', keyboard: false});
	initDB();
	setState();
});

$(document).on('click', '.new_instrument', function(e){
	e.preventDefault();
	$("#new_instrument_modal").modal("show");
	$("#addInstrumentButton").off("click").click(function(){
		var err = msg=>{
			$("#new_instrument_modal")[0].scrollTo(0,0);
			$(".modalerroralert").find(".errortext").html(msg);
			$(".modalerroralert").slideDown("fast", function(){
				setTimeout(()=>$(".modalerroralert").slideUp("fast"),5000);
			});
		};
		var name = $("#inst-name-input").val();
		if(!name) return err("Enter a name for this instrument.");
		if(DB.instruments[name]) return err("That name is taken please choose another one.");
		var frets = parseInt($("#fret-cnt-input").val());
		if(!frets) return err("Enter the number of frets the instrument has.");
		if(frets>35) return err(frets+" frets is too many.");
		var strings = parseInt($("#string-cnt-input").val());
		if(!strings) return err("Enter the number of strings the instrument has.");
		if(2>strings) return err(strings+" strings is not enough.");
		if(strings>12) return err(strings+" strings is too many.");
		var tuning = $("#tuning-input").val().split(",").map(a=>a.trim());
		if(tuning.length<strings) return err("You did not enter enough notes for a "+strings+" stringed instrument.");
		if(tuning.length>strings) return err("You entered too many notes for a "+strings+" stringed instrument.");
		for(var i=0; i<tuning.length; i++){
			var t = validateNote(tuning[i]);
			if(!t) return err(tuning[i]+" is not a valid note.");
			tuning[i]=t;
		}
		var hasMarker = [];
		var singleFretMarkers = $("#sngl-fret-mrkr-input").val().trim() == "" ? [] : $("#sngl-fret-mrkr-input").val().split(",").map(a=>a.trim());
		var dblFretMarkers = $("#dbl-fret-mrkr-input").val().trim() == "" ? [] : $("#dbl-fret-mrkr-input").val().split(",").map(a=>a.trim());
		for(var i=0; i<singleFretMarkers.length; i++){
			if(~hasMarker.indexOf(singleFretMarkers[i])) return err("You have multiple fretmarkers on fret "+singleFretMarkers[i]);
			if(isNaN(parseInt(singleFretMarkers[i]))) return err("You have a non-number ("+singleFretMarkers[i]+") in your fret marker list.");
			singleFretMarkers[i]=parseInt(singleFretMarkers[i]);
			if(singleFretMarkers[i]>frets) return err("You can't put a fret marker on fret "+singleFretMarkers[i]+" when there are only "+frets+" frets.");
			if(singleFretMarkers[i]<1) return err("You can't put a fret marker on the 0th fret.");
		}
		for(var i=0; i<dblFretMarkers.length; i++){
			if(~hasMarker.indexOf(dblFretMarkers[i])) return err("You have multiple fretmarkers on fret "+dblFretMarkers[i]);
			if(isNaN(parseInt(dblFretMarkers[i]))) return err("You have a non-number ("+dblFretMarkers[i]+") in your fret marker list.");
			dblFretMarkers[i]=parseInt(dblFretMarkers[i]);
			if(dblFretMarkers[i]>frets) return err("You can't put a fret marker on fret "+dblFretMarkers[i]+" when there are only "+frets+" frets.");
			if(dblFretMarkers[i]<1) return err("You can't put a fret marker on the 0th fret.");
		}
		DB.instruments[name]={
			frets: frets,
			strings: strings,
			tuning: tuning,
			dblFretMarkers: dblFretMarkers,
			snglFretMarkers: singleFretMarkers,
			userCreated: true
		};
		Fretted.makeInstrument({ 
			name: name, 
			frets: DB.instruments[name].frets, 
			strings: DB.instruments[name].strings, 
			doubleFretMarkers: DB.instruments[name].dblFretMarkers, 
			singleFretMarkers: DB.instruments[name].snglFretMarkers, 
			tuning: DB.instruments[name].tuning
		});
		setInstrument(name);
		$("#instruments_dropdown").append('<li><a href="#" class="change_instrument" data-instrument="'+encodeURIComponent(name)+'">'+name+'&nbsp;&nbsp;<span class="pull-right remove-instrument" style="color:red;font-weight:bold;">&times;</span></li>');
		$("#inst-name-input").val('');
		$("#fret-cnt-input").val('');
		$("#string-cnt-input").val('');
		$("#tuning-input").val('');
		$("#dbl-fret-mrkr-input").val('');
		$("#sngl-fret-mrkr-input").val('');
		$("#new_instrument_modal").modal("hide");
	});
});

$(document).on('click', '.print', function(){
	window.print();
});

$(document).on('click', '.change_instrument', function(e){
	e.preventDefault();
	var inst = decodeURIComponent($(this).data('instrument'));
	setInstrument(inst);
	setKey(DB.state.key);
});

$(document).on('click', '.open_page', function(e){
	e.preventDefault();
	var page = $(this).data('page');
	openPage(page);
});

$(document).on('click', '.remove-instrument', function(e){
	e.stopPropagation();
	var inst = $(this).parent().data('instrument');
	if(!confirm("Are you sure you wanna delete "+inst+"?")) return;
	$(this).parent().parent().remove();
	if(DB.state.instrument === inst){
		var names = Object.keys(DB.instruments);
		var newinst = names[0]===inst?names[1]:names[0];
		setInstrument(newinst);
	}
	delete DB.instruments[inst];
	saveDB();
});

$(document).on("change", "#scale_key", function(){
	var key = $(this).val();
	setKey(key);
});

function validateNote(note){
	var noteMap = ['C',['C#','Db'],'D',['D#','Eb'],'E','F',['F#','Gb'],'G',['G#','Ab'],'A',['A#','Bb'],'B'];
	note = note.toUpperCase();
	for(var i=0; i<noteMap.length; i++){
		if(Array.isArray(noteMap[i])){
			if(note === noteMap[i][0].toUpperCase() || note === noteMap[i][1].toUpperCase()) return noteMap[i][0];
		}else{
			if(note === noteMap[i].toUpperCase()) return noteMap[i];
		}
	}
	return false;
}

function openPage(page){
	$(".page").slideUp('fast', ()=>$("#"+page+"_page").slideDown());
	DB.state.tab=page;
	saveDB();
}

function setInstrument(name){
	if(!DB.instruments[name]) return;
	$(".current_instrument").html(name);
	var notes = new Voicings().setInstrument(DB.instruments[name].strings, DB.instruments[name].frets+1, DB.instruments[name].tuning).getFretboard();
	var f = Fretted[name]();
	for(var string=0; string<notes.length; string++){
		for(var fret=0; fret<notes[string].length; fret++){
			if(fret===0) f.fretboard.openString(string+1, notes[string][fret]);
			else f.fretboard.markNote(notes[string][fret], fret, string+1, "#63AFD0", "#000000");
		}
	}
	f.render(Fretted.IMAGE).then(img=>{
		$("#fretboard-img").empty();
		$(img).addClass("img-responsive").css({margin:"0 auto"}).appendTo("#fretboard-img");
	});
	DB.state.instrument = name;
	saveDB();
}

function setState(){
	$("#instruments_dropdown").empty();
	$("#instruments_dropdown").append('<li><a href="#" class="new_instrument"><span class="glyphicon glyphicon-edit"></span> New Instrument</a></li>');
	for(var name in DB.instruments){ 
		if(DB.instruments.hasOwnProperty(name)){ 
			$("#instruments_dropdown").append('<li><a href="#" class="change_instrument" data-instrument="'+encodeURIComponent(name)+'">'+name+'&nbsp;&nbsp;'+(DB.instruments[name].userCreated?'<span class="pull-right remove-instrument" style="color:red;font-weight:bold;">&times;</span>':'')+'</a></li>'); 
		}
	}
	var notes = Musicology.getNotes();
	for(var i=0; i<notes.length; i++){
		$("#scale_key").append('<option value="'+notes[i]+'" '+(DB.state.key==notes[i]?'selected':'')+'>'+notes[i]+'</option>');
	}
	setKey(DB.state.key);
	setInstrument(DB.state.instrument);
	openPage(DB.state.tab);
}

function setKey(key){
	$(".current_key").html(key);
	$("#scalebox").empty();
	var modes = Musicology.getModesNames();
	modes.forEach(mode=>{
		if(mode==='major') return;
		if(mode==='ionian') mode = "Major";
		var titlecase = mode.replace(/\w\S*/g, function(txt){
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
		var id = mode.replace(/ /g, "-")+"scale-chart";
		$("#scalebox").append('<div class="nobreak"><h3>'+titlecase+'</h3><div id="'+id+'" style=text-align:center; margin:0 auto;></div></div>');
		var scale_notes = Musicology.getScale(key, mode);
		var scale = new Fretted.Scale().setNotes(scale_notes).setRootNote(key).setNoteStyle('#63AFD0').setRootNoteStyle('#BAEAFF', '#3BA3D0');
		Fretted[DB.state.instrument]().makeScale(scale).render(Fretted.IMAGE).then(img=>{
			$(img).addClass("img-responsive").css({margin:"0 auto"}).appendTo("#"+id);
		});
	});
	DB.state.key = key;
	saveDB();
}

function initDB(){		
	DB.state = localStorage.getItem('state');
	if(!DB.state) DB.state = {instrument:'Guitar (Standard)', tab: 'home', key:'C'}
	else DB.state = JSON.parse(DB.state);
	DB.instruments = localStorage.getItem('instruments');
	if(!DB.instruments){
		DB.instruments = {};
		DB.instruments['Guitar (Standard)']={
			frets: 24,
			strings: 6,
			tuning: ["E","B","G","D","A","E"],
			dblFretMarkers: [12,24],
			snglFretMarkers: [3,5,7,9,15,17,19,21]
		};
		DB.instruments['Bass (Standard)']={
			frets: 24,
			strings: 4,
			tuning: ["G","D","A","E"],
			dblFretMarkers: [12,24],
			snglFretMarkers: [3,5,7,9,15,17,19,21]
		};
		DB.instruments['Ukulele (Standard)']={
			frets: 18,
			strings: 4,
			tuning: ["A","E","C","G"],
			dblFretMarkers: [12],
			snglFretMarkers: [5,7,10,14]
		};
		DB.instruments['Mandolin (Standard)']={
			frets: 20,
			strings: 4,
			tuning: ["E","A","D","G"],
			dblFretMarkers: [12],
			snglFretMarkers: [3,5,7,10,15]
		};
	}else DB.instruments = JSON.parse(DB.instruments);
	
	for(var name in DB.instruments){
		if(!DB.instruments.hasOwnProperty(name)) continue;
		Fretted.makeInstrument({ 
			name: name, 
			frets: DB.instruments[name].frets, 
			strings: DB.instruments[name].strings, 
			doubleFretMarkers: DB.instruments[name].dblFretMarkers, 
			singleFretMarkers: DB.instruments[name].snglFretMarkers, 
			tuning: DB.instruments[name].tuning
		});
	}
	
	saveDB();
}

function saveDB(){
	for(var table in DB){
		if(!DB.hasOwnProperty(table)) continue;
		localStorage.setItem(table, JSON.stringify(DB[table]));
	}
}