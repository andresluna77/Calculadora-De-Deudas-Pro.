window.onload = function() {
    let guardado = JSON.parse(localStorage.getItem("datosDeudas"));
    if (!guardado) return;
    document.getElementById("sueldo").value = guardado.sueldo || "";
    document.getElementById("tipoIngreso").value = guardado.tipoIngreso || "mensual";
    document.getElementById("abonoVoluntario").value = guardado.abonoVoluntario || ""; 
    if(guardado.gastos) guardado.gastos.forEach(g => crearFilaGasto(g.nombre, g.valor));
    if(guardado.deudas) guardado.deudas.forEach(d => crearFilaDeuda(d.nombre, d.monto, d.estado, d.pago));
};

function formatearNumero(input) {
    let valor = input.value.replace(/\./g, "").replace(/\D/g, "");
    input.value = valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function agregarGasto() { crearFilaGasto("", ""); }
function agregarDeuda() { crearFilaDeuda("", "", false, ""); }

function crearFilaGasto(nombre = "", valor = "") {
    let tabla = document.querySelector("#tablaGastos tbody");
    let fila = tabla.insertRow();
    fila.insertCell(0).innerHTML = `<input value="${nombre}" placeholder="Ej: Internet">`;
    fila.insertCell(1).innerHTML = `<input oninput="formatearNumero(this)" value="${valor}" placeholder="Valor">`;
    fila.insertCell(2).innerHTML = `<button onclick="this.closest('tr').remove()" style="background:#dc3545; padding:5px 10px;">X</button>`;
}

function crearFilaDeuda(nombre = "", monto = "", estado = false, pago = "") {
    let tabla = document.querySelector("#tablaDeudas tbody");
    let fila = tabla.insertRow();
    fila.insertCell(0).innerHTML = `<input value="${nombre}" placeholder="Ej: Tarjeta">`;
    fila.insertCell(1).innerHTML = `<input oninput="formatearNumero(this)" value="${monto}" placeholder="Total">`;
    fila.insertCell(2).innerHTML = `<label style="display:flex;align-items:center;gap:5px"><input type="checkbox" ${estado ? 'checked' : ''} onchange="actualizarTxt(this)"><span>${estado ? 'Pagado' : 'Pendiente'}</span></label>`;
    fila.insertCell(3).innerHTML = `<input oninput="formatearNumero(this)" value="${pago}" placeholder="Mínimo">`;
    fila.insertCell(4).innerHTML = `<button onclick="this.closest('tr').remove()" style="background:#dc3545; padding:5px 10px;">X</button>`;
}

function actualizarTxt(checkbox) { checkbox.nextElementSibling.innerText = checkbox.checked ? "Pagado" : "Pendiente"; }

function limpiarTodo() { if (confirm("¿Borrar todo?")) { localStorage.clear(); location.reload(); } }

function irAResultados() {
    let sueldo = document.getElementById("sueldo").value;
    if (!sueldo) return alert("Ingresa tu sueldo.");
    let datos = { sueldo: sueldo, abonoVoluntario: document.getElementById("abonoVoluntario").value, tipoIngreso: document.getElementById("tipoIngreso").value, deudas: [], gastos: [] };
    document.querySelectorAll("#tablaDeudas tbody tr").forEach(fila => {
        let inputs = fila.querySelectorAll("input");
        datos.deudas.push({ nombre: inputs[0].value, monto: inputs[1].value, estado: inputs[2].checked, pago: inputs[3].value });
    });
    document.querySelectorAll("#tablaGastos tbody tr").forEach(fila => {
        let inputs = fila.querySelectorAll("input");
        datos.gastos.push({ nombre: inputs[0].value, valor: inputs[1].value });
    });
    localStorage.setItem("datosDeudas", JSON.stringify(datos));
    window.location.href = "resultados.html";
}