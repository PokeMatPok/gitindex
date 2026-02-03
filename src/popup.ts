function registerDiv(): HTMLDivElement {

    console.log("created div")

    const popup = document.createElement("div");
    popup.style.position = "absolute";
    popup.style.zIndex = "999999";
    popup.style.padding = "6px 10px";
    popup.style.background = "#24292f";
    popup.style.color = "#fff";
    popup.style.borderRadius = "6px";
    popup.style.fontSize = "12px";
    popup.style.pointerEvents = "none";
    popup.style.whiteSpace = "nowrap";
    popup.style.display = "none";
    popup.style.transition = "opacity 0.15s ease";
    popup.textContent = "Hello World!";

    document.body.appendChild(popup);

    return popup
}

function showDiv(popup: HTMLDivElement, link: HTMLElement) {
    console.log("hover")
    link.style.color = "red";

    popup.style.display = "block"

    const rect = link.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 6;
    let left = rect.left + window.scrollX;

    if (left + popup.offsetWidth > window.innerWidth) {
        left = window.innerWidth - popup.offsetWidth - 6;
    }

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
}

export {
    registerDiv, 
    showDiv
}