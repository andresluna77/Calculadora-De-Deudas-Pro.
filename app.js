window.onload = function() {
    let guardado = JSON.parse(localStorage.getItem("datosDeudas"));
    if (!guardado) return;
    document.getElementById("sueldo").value = guardado.sueldo || "";
    document.getElementById("tipoIngreso").value = guardado.tipoIngreso || "mensual";
    document.getElementById("reserva").value = guardado.reserva || ""; // Cargar reserva
    guardado.gastos.forEach(g => crearFilaGasto(g.nombre, g.valor));
    guardado.deudas.forEach(d => crearFilaDeuda(d.nombre, d.monto, d.estado, d.pago));
};

function formatearNumero(i) {
    let v = i.value.replace(/\./g, "").replace(/\D/g, "");
    i.value = v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function crearFilaGasto(n="", v="") {
    let t = document.querySelector("#tablaGastos tbody"), f = t.insertRow();
    f.insertCell(0).setAttribute("data-label", "Nombre");
    f.cells[0].innerHTML = `<input value="${n}" placeholder="Ej: Arriendo">`;
    f.insertCell(1).setAttribute("data-label", "Valor");
    f.cells[1].innerHTML = `<input oninput='formatearNumero(this)' value="${v}" placeholder="Valor">`;
    f.insertCell(2).innerHTML = "<button onclick='this.closest(\"tr\").remove()' style='background:#dc3545'>X</button>";
}

function crearFilaDeuda(n="", m="", e=false, p="") {
    let t = document.querySelector("#tablaDeudas tbody"), f = t.insertRow();
    f.insertCell(0).setAttribute("data-label", "Nombre");
    f.cells[0].innerHTML = `<input value="${n}" placeholder="Ej: Banco">`;
    f.insertCell(1).setAttribute("data-label", "Monto");
    f.cells[1].innerHTML = `<input oninput='formatearNumero(this)' value="${m}" placeholder="Total">`;
    f.insertCell(2).setAttribute("data-label", "Estado");
    f.cells[2].innerHTML = `<label style="display:flex;align-items:center;gap:5px"><input type="checkbox" ${e?'checked':''} onchange="actualizarTxt(this)"><span>${e?'Pagado':'Pendiente'}</span></label>`;
    f.insertCell(3).setAttribute("data-label", "Pago");
    f.cells[3].innerHTML = `<input oninput='formatearNumero(this)' value="${p}" placeholder="Cuota">`;
    f.insertCell(4).innerHTML = "<button onclick='this.closest(\"tr\").remove()' style='background:#dc3545'>X</button>";
}

function actualizarTxt(c) { c.nextElementSibling.innerText = c.checked ? "Pagado" : "Pendiente"; }
function agregarGasto() { crearFilaGasto(); }
function agregarDeuda() { crearFilaDeuda(); }

function irAResultados() {
    let sueldo = document.getElementById("sueldo");
    let reserva = document.getElementById("reserva");
    if(!sueldo.value) return alert("Ingresa tu sueldo.");
    
    let datos = { 
        sueldo: sueldo.value, 
        reserva: reserva.value, // Guardar reserva
        tipoIngreso: document.getElementById("tipoIngreso").value, 
        deudas: [], 
        gastos: [] 
    };
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