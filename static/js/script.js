function trashClicked(i){
    const div = document.getElementById('trashCan' + i)
    div.innerHTML = "<div style = 'display: flex;'><button onclick ='switchToTrashCan("+i+")' id = 'cancel'>Cancel</button><button id = 'confirmDelete' type='submit' form='deleteForm"+i+"'>Confirm deletion</button></div>"
}
function switchToTrashCan(i){
    const div = document.getElementById("trashCan" + i)
    div.innerHTML = "<i onclick = 'trashClicked("+i+")' class='fa fa-trash fa-2x'></i>"
}

    function trashClickedR(i){
        const div = document.getElementById('trashCanR' + i)
        div.innerHTML = "<div style = 'display: flex;'><button onclick ='switchToTrashCanR("+i+")' id = 'cancel'>Cancel</button><button id = 'confirmDelete' type='submit' form='deleteFormR" + i+"'>Confirm deletion</button></div>"
        

    }
    function switchToTrashCanR(i){
        const div = document.getElementById('trashCanR' + i)
        div.innerHTML = "<i onclick = 'trashClickedR("+i+")' class='fa fa-trash fa-2x'></i>"
    }
