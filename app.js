window.onload = function() {
    let datosGuardados = JSON.parse(localStorage.getItem("datosDeudas"));
    if (!datosGuardados) return;

    document.getElementById("sueldo").value = datosGuardados.sueldo || "";
    document.getElementById("tipoIngreso").value = datosGuardados.tipoIngreso || "mensual";

    // Recuperar Gastos
    datosGuardados.gastos.forEach(g => {
        let t = document.getElementById("tablaGastos");
        let f = t.insertRow();
        f.insertCell(0).innerHTML = `<input value="${g.nombre}">`;
        f.insertCell(1).innerHTML = `<input oninput='formatearNumero(this)' value="${g.valor}">`;
        f.insertCell(2).innerHTML = "<button onclick='this.closest(\"tr\").remove()' style='background:#dc3545'>X</button>";
    });

    // Recuperar Deudas
    datosGuardados.deudas.forEach(d => {
        let t = document.getElementById("tablaDeudas");
        let f = t.insertRow();
        f.className = d.estado ? "pagado" : "";
        f.insertCell(0).innerHTML = `<input value="${d.nombre}">`;
        f.insertCell(1).innerHTML = `<input oninput='formatearNumero(this)' value="${d.monto}">`;
        let check = d.estado ? "checked" : "";
        f.insertCell(2).innerHTML = `<label><input type="checkbox" ${check} onchange="cambiarEstado(this)"><span>${d.estado?'Pagado':'Pendiente'}</span></label>`;
        f.insertCell(3).innerHTML = `<input oninput='formatearNumero(this)' value="${d.pago}">`;
        f.insertCell(4).innerHTML = "<button onclick='this.closest(\"tr\").remove()' style='background:#dc3545'>X</button>";
    });
};

function formatearNumero(input) {
    let valor = input.value.replace(/\./g, "").replace(/\D/g, "");
    input.value = valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function agregarGasto() {
    let t = document.getElementById("tablaGastos");
    let f = t.insertRow();
    f.insertCell(0).innerHTML = "<input placeholder='Ej: Arriendo'>";
    f.insertCell(1).innerHTML = "<input oninput='formatearNumero(this)' placeholder='Valor'>";
    f.insertCell(2).innerHTML = "<button onclick='this.closest(\"tr\").remove()' style='background:#dc3545'>X</button>";
}

function agregarDeuda() {
    let t = document.getElementById("tablaDeudas");
    let f = t.insertRow();
    f.insertCell(0).innerHTML = "<input placeholder='Ej: Banco'>";
    f.insertCell(1).innerHTML = "<input oninput='formatearNumero(this)' placeholder='Total'>";
    f.insertCell(2).innerHTML = `<label><input type="checkbox" onchange="cambiarEstado(this)"><span>Pendiente</span></label>`;
    f.insertCell(3).innerHTML = "<input oninput='formatearNumero(this)' placeholder='Cuota'>";
    f.insertCell(4).innerHTML = "<button onclick='this.closest(\"tr\").remove()' style='background:#dc3545'>X</button>";
}

function cambiarEstado(c) {
    let t = c.nextElementSibling;
    let f = c.closest("tr");
    if (c.checked) { t.innerText = "Pagado"; f.classList.add("pagado"); } 
    else { t.innerText = "Pendiente"; f.classList.remove("pagado"); }
}

function guardarDatos() {
    let datos = {
        sueldo: document.getElementById("sueldo").value,
        tipoIngreso: document.getElementById("tipoIngreso").value,
        deudas: [], gastos: []
    };
    document.querySelectorAll("#tablaDeudas tr").forEach((f, i) => {
        if (i === 0) return;
        datos.deudas.push({
            nombre: f.cells[0].children[0].value,
            monto: f.cells[1].children[0].value,
            estado: f.cells[2].children[0].checked,
            pago: f.cells[3].children[0].value
        });
    });
    document.querySelectorAll("#tablaGastos tr").forEach((f, i) => {
        if (i === 0) return;
        datos.gastos.push({ nombre: f.cells[0].children[0].value, valor: f.cells[1].children[0].value });
    });
    localStorage.setItem("datosDeudas", JSON.stringify(datos));
}

function irAResultados() {
    if(!document.getElementById("sueldo").value) return alert("Ingresa tu sueldo.");
    guardarDatos();
    window.location = "resultados.html";
}

function limpiarTodo() {
    if(confirm("¿Borrar todo?")) { localStorage.clear(); location.reload(); }
}