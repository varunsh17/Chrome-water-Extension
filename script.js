document.getElementById("add").addEventListener("click", remind);

function remind() {
    const minutes = parseInt(document.getElementById("num").value);
    console.log(minutes);
    if (isNaN(minutes)) {
        console.log("not a number")
    }
    else if (minutes == 0) {
        console.log("Entered Greater than 0")
    }
    else {
        console.log(minutes);
        chrome.runtime.sendMessage({ minutes }, function (response) {
            console.log(response);
        });
    }

}