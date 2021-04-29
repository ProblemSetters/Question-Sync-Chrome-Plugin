API_URL = "https://www.hackerrank.com/x/api/v3/questions/";
GITHUB_API_URL = "https://api.github.com/repos/ProblemSetters/";
HRW_TOKEN = "";
GITHUB_TOKEN = "";
GITHUB_REPO = "";
current_url = "null";
var updateURL = new Promise((resolve, reject) => {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        resolve(tabs[0].url);
    });
});
function isInt(value) {
    return !isNaN(value) && 
        parseInt(Number(value)) == value && 
        !isNaN(parseInt(value, 10));
}
function httpGet(theUrl, method=null, token=null) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false); // false for synchronous request
    if(method != null){
        xmlHttp.setRequestHeader('Authorization', method + ' ' + token);
    }
    xmlHttp.send();
    return xmlHttp;
}
function getBranches() {
    var response = httpGet(GITHUB_API_URL + GITHUB_REPO + "/branches", "token", GITHUB_TOKEN);
    var info = JSON.parse(response.responseText);
    var branches = [];
    for(let i = 0; i < info.length; i++) {
        branches.push(info[i].name);
    }
    return branches;
}
function getContent(url){
    var response = httpGet(url);
    return response.responseText;
}
function syncPS() {
    if(problemStatement != null){
        var theUrl = API_URL + questionInfo.id;
        var body = {
            "problem_statement": problemStatement
        };
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("PUT", theUrl, false);
        xmlHttp.setRequestHeader('Authorization', "Bearer" + ' ' + HRW_TOKEN);
        xmlHttp.setRequestHeader('content-type', 'application/json');
        xmlHttp.send(JSON.stringify(body));
        if(xmlHttp.status == 200) {
            logDiv.innerHTML = "Success!";
        }
    }
}
function syncIN() {
    if(internalNotes != null){
        var theUrl = API_URL + questionInfo.id;
        var body = {
            "internal_notes": internalNotes
        };
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("PUT", theUrl, false);
        xmlHttp.setRequestHeader('Authorization', "Bearer" + ' ' + HRW_TOKEN);
        xmlHttp.setRequestHeader('content-type', 'application/json');
        xmlHttp.send(JSON.stringify(body));
        console.log(xmlHttp);
        if(xmlHttp.status == 200) {
            logDiv.innerHTML = "Success!";
        }
    }
}
function gatherData() {
    var branches = getBranches();
    problemStatement = null;
    internalNotes = null;
    for(let i = 0; i < branches.length; i++){
        var filesResp = httpGet(GITHUB_API_URL + GITHUB_REPO + "/contents?ref=" + branches[i], "token", GITHUB_TOKEN);
        var files = JSON.parse(filesResp.responseText);
        for(let i = 0; i < files.length; i++){
            if(files[i].name == "problem_statement.html"){
                problemStatement = httpGet(files[i].download_url, "token", GITHUB_TOKEN).responseText;
            }
            if(files[i].name == "internal_notes.html"){
                internalNotes = httpGet(files[i].download_url, "token", GITHUB_TOKEN).responseText;
            }
        }
    }
}
async function checkURL(){
    await updateURL.then((url) => {
        var BASE_URL = "https://github.com/ProblemSetters/";
        if(url.startsWith(BASE_URL)){
            url = url.replace(BASE_URL, "");
            url = url.split("/")[0];
            GITHUB_REPO = url;
            var r = url.split("-");
            r[r.length - 1] = r[0].split("/")[r[0].split("/").length-1];
            if(isInt(r[0])){
                var api_endpoint = API_URL + r[0];
                response = httpGet(api_endpoint, "Bearer", HRW_TOKEN);
                if(response.status == 200){
                    waitDiv.classList.add("invisible");
                    foundDiv.classList.remove("invisible");
                    questionInfo = JSON.parse(response.responseText);
                    qidSpan.innerHTML = questionInfo.id;
                    nameSpan.innerHTML = questionInfo.name;
                    linkDiv.onclick = function() {chrome.tabs.create({url: "https://www.hackerrank.com/x/library/personal/all/questions/" + questionInfo.id + "/view"})};
                    syncpsDiv.onclick = syncPS;
                    syncinDiv.onclick = syncIN;
                    gatherData();
                }
            }
        }
        if(foundDiv.classList.contains("invisible")){
            waitDiv.classList.add("invisible");
            notfoundDiv.classList.remove("invisible");
        }
    });
}
document.addEventListener("DOMContentLoaded", function() {
    var credentials = JSON.parse(data)[0];
    HRW_TOKEN = credentials.HRW_TOKEN;
    GITHUB_TOKEN = credentials.GITHUB_TOKEN;
    waitDiv = document.getElementById("wait");
    foundDiv = document.getElementById("found");
    notfoundDiv = document.getElementById("notfound");
    qidSpan = document.getElementById("qid");
    nameSpan = document.getElementById("name");
    linkDiv = document.getElementById("link");
    syncpsDiv = document.getElementById("syncps");
    syncinDiv = document.getElementById("syncin");
    logDiv = document.getElementById("log");
    response = checkURL();
});
