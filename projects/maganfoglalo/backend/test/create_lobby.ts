(async ()=>{
    let code = await (await fetch("http://localhost:4000/create_lobby")).text();
    console.log("created lobby code: ", code);
})();