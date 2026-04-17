const inputBox = document.getElementById("input-box")
const listContainer = document.getElementById("list-container")

let lastDeletedNode = null;

const modal = document.getElementById("deleteModal");
const modalText = document.getElementById("modalText");
const confirmBtn = document.getElementById("confirmDelete");
const cancelBtn = document.getElementById("cancelDelete");
let itemToDelete = null;

function undoDelete() {
    if (lastDeletedNode) {
        listContainer.appendChild(lastDeletedNode);
        lastDeletedNode = null;
        saveData();
    } else {
        alert("Nothing to restore!");
    }
}

function addTask(){
    if(inputBox.value === ""){
        alert("Field cannot be empty");
    }
    else {
        let li = document.createElement("li");
        li.innerHTML = inputBox.value;
        listContainer.appendChild(li);
        let span = document.createElement("span");
        span.innerHTML = "\u00d7";
        li.appendChild(span);
    }

    inputBox.value = "";
    saveData();
}

function searchTasks() {
    const query = document.getElementById("search-box").value;
    const isIgnoreSpace = document.getElementById("case-sensitive").checked;
    
    const tasks = document.querySelectorAll("li");

    tasks.forEach(task => {
        let text = task.firstChild.textContent;
        
        let match = false;
        if (isIgnoreSpace) {
            match = text.toLowerCase().includes(query.toLowerCase());
        } else {
            match = text.includes(query);
        }

        if (match) {
            task.style.display = "";
        } else {
            task.style.display = "none";
        }
    });
}

listContainer.addEventListener("click", function(e){
    if(e.target.tagName === "LI"){
        e.target.classList.toggle("Checked");
        
        if(e.target.classList.contains("Checked")){
            let now = new Date();
            let dateString = ` (Done: ${now.toLocaleDateString()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')})`;
            
            let dateElement = document.createElement("small");
            dateElement.classList.add("completion-date");
            dateElement.innerHTML = dateString;
            e.target.appendChild(dateElement);
        } else {
            let dateElement = e.target.querySelector(".completion-date");
            if(dateElement) dateElement.remove();
        }
        saveData();
    }
    else if(e.target.tagName === "SPAN"){
        itemToDelete = e.target.parentElement;
        let taskText = itemToDelete.firstChild.textContent;
        
        modalText.innerHTML = `Czy na pewno chcesz usunąc zadanie o treści: <br><b>"${taskText}"</b>?`;
        modal.style.display = "block";
    }
}, false);

confirmBtn.onclick = function() {
    if (itemToDelete) {
        lastDeletedNode = itemToDelete.cloneNode(true);
        
        itemToDelete.remove();
        itemToDelete = null;
        modal.style.display = "none";
        saveData();
    }
}

cancelBtn.onclick = function() {
    modal.style.display = "none";
    itemToDelete = null;
}

document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && (event.key === 'z' || event.key === 'Z' || event.key === 'я' || event.key === 'Я')) {
        undoDelete();
    }
});

function saveData(){
    localStorage.setItem("data", listContainer.innerHTML);
}

function showTask(){
    listContainer.innerHTML = localStorage.getItem("data");
}
showTask();
