
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
	});
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
	DB.state.tab=page;
	saveDB();
}

function setInstrument(name){
	if(!DB.instruments[name]) return;
	$(".current_instrument").html(name);
	DB.state.instrument = name;
	saveDB();
}

function setState(){
	$("#instruments_dropdown").empty();
	for(var name in DB.instruments) if(DB.instruments.hasOwnProperty(name)) $("#instruments_dropdown").append('<li><a href="#" class="change_instrument" data-instrument="'+encodeURIComponent(name)+'">'+name+'</li>')
	$("#instruments_dropdown").append('<li><a href="#" class="new_instrument"><span class="glyphicon glyphicon-edit"></span> New Instrument</a></li>');
	setInstrument(DB.state.instrument);
	openPage(DB.state.tab);
}

function initDB(){		
	DB.state = localStorage.getItem('state');
	if(!DB.state) DB.state = {instrument:'Guitar (Standard)', tab: 'home'}
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
	saveDB();
}

function saveDB(){
	for(var table in DB){
		if(!DB.hasOwnProperty(table)) continue;
		localStorage.setItem(table, JSON.stringify(DB[table]));
	}
}