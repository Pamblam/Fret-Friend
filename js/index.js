
function readyPage(){
	return new Promise(done=>{
		var docReday = new Promise(d=>$(d));
		var jsqlReday = new Promise(d=>jSQL.load(d));
		Promise.all([docReday,jsqlReday]).then(done);
	});
}

readyPage().then(()=>{
	console.log("shit's ready");
});