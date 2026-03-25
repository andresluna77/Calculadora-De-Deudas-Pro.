window.onload = function() {
    let guardado = JSON.parse(localStorage.getItem("datosDeudas"));
    if (!guardado) return;

    document.getElementById("sueldo").value = guardado.sueldo || "";

    guardado.gastos.forEach(g => {
        let t = document.querySelector("#tablaGastos tbody"), f = t.insertRow();
        let c1 = f.insertCell(0); c1.setAttribute("data-label", "Nombre");
        c1.innerHTML = `<input value="${g.nombre}">`;
        let c2 = f.insertCell(1); c2.setAttribute("data-label", "Valor");
        c2.innerHTML = `<input oninput='formatearNumero(this)' value="${g.valor}">`;
        f.insertCell(2).innerHTML = "<button onclick='this.closest(\"tr\").remove()' style='background:#dc3545'>X</button>";
    });

    guardado.deudas.forEach(d => {
        let t = document.querySelector("#tablaDeudas tbody"), f = t.insertRow();
        f.className = d.estado ? "pagado" : "";
        let c1 = f.insertCell(0); c1.setAttribute("data-label", "Nombre");
        c1.innerHTML = `<input value="${d.nombre}">`;
        let c2 = f.insertCell(1); c2.setAttribute("data-label", "Monto");
        c2.innerHTML = `<input oninput='formatearNumero(this)' value="${d.monto}">`;
        let c3 = f.insertCell(2); c3.setAttribute("data-label", "Estado");
        c3.innerHTML = `<label><input type="checkbox" ${d.estado?'checked':''} onchange="cambiarEstado(this)"><span>${d.estado?'Pagado':'Pendiente'}</span></label>`;
        let c4 = f.insertCell(3); c4.setAttribute("data-label", "Pago");
        c4.innerHTML = `<input oninput='formatearNumero(this)' value="${d.pago}">`;
        f.insertCell(4).innerHTML = "<button onclick='this.closest(\"tr\").remove()' style='background:#dc3545'>X</button>";
    });
};

function formatearNumero(input) {
    let v = input.value.replace(/\./g, "").replace(/\D/g, "");
    input.value = v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function agregarGasto() {
    let t = document.querySelector("#tablaGastos tbody"), f = t.insertRow();
    let c1 = f.insertCell(0); c1.setAttribute("data-label", "Nombre");
    c1.innerHTML = "<input placeholder='Ej: Arriendo'>";
    let c2 = f.insertCell(1); c2.setAttribute("data-label", "Valor");
    c2.innerHTML = "<input oninput='formatearNumero(this)' placeholder='Valor'>";
    f.insertCell(2).innerHTML = "<button onclick='this.closest(\"tr\").remove()' style='background:#dc3545'>X</button>";
}

function agregarDeuda() {
    let t = document.querySelector("#tablaDeudas tbody"), f = t.insertRow();
    let c1 = f.insertCell(0); c1.setAttribute("data-label", "Nombre");
    c1.innerHTML = "<input placeholder='Ej: Banco'>";
    let c2 = f.insertCell(1); c2.setAttribute("data-label", "Monto");
    c2.innerHTML = "<input oninput='formatearNumero(this)' placeholder='Total'>";
    let c3 = f.insertCell(2); c3.setAttribute("data-label", "Estado");
    c3.innerHTML = `<label><input type="checkbox" onchange="cambiarEstado(this)"><span>Pendiente</span></label>`;
    let c4 = f.insertCell(3); c4.setAttribute("data-label", "Pago");
    c4.innerHTML = "<input oninput='formatearNumero(this)' placeholder='Mínimo'>";
    f.insertCell(4).innerHTML = "<button onclick='this.closest(\"tr\").remove()' style='background:#dc3545'>X</button>";
}

function cambiarEstado(c) {
    let t = c.nextElementSibling, f = c.closest("tr");
    if (c.checked) { t.innerText = "Pagado"; f.classList.add("pagado"); } 
    else { t.innerText = "Pendiente"; f.classList.remove("pagado"); }
}

function irAResultados() {
    let datos = { sueldo: sueldo.value, deudas: [], gastos: [] };
    document.querySelectorAll("#tablaDeudas tbody tr").forEach(f => {
        datos.deudas.push({ nombre: f.cells[0].children[0].value, monto: f.cells[1].children[0].value, estado: f.cells[2].querySelector("input").checked, pago: f.cells[3].children[0].value });
    });
    document.querySelectorAll("#tablaGastos tbody tr").forEach(f => {
        datos.gastos.push({ nombre: f.cells[0].children[0].value, valor: f.cells[1].children[0].value });
    });
    localStorage.setItem("datosDeudas", JSON.stringify(datos));
    window.location = "resultados.html";
}

function limpiarTodo() { if(confirm("¿Borrar todo?")) { localStorage.clear(); location.reload(); } }