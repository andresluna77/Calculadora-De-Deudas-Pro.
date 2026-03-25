window.onload = function() {
    let datos = JSON.parse(localStorage.getItem("datosDeudas"));
    if (!datos) return;

    let metodo = localStorage.getItem("metodo") || "normal";
    document.getElementsByName("metodo").forEach(r => { if(r.value === metodo) r.checked = true; });

    let sueldo = Number(datos.sueldo.replace(/\./g, "") || 0);
    let totalD = 0, pagosMin = 0;
    datos.deudas.forEach(d => {
        if (!d.estado) {
            totalD += Number(d.monto.replace(/\./g, "") || 0);
            pagosMin += Number(d.pago.replace(/\./g, "") || 0);
        }
    });

    let gFijos = 0;
    datos.gastos.forEach(g => { gFijos += Number(g.valor.replace(/\./g, "") || 0); });

    let disponible = sueldo - (pagosMin + gFijos);
    let porc = sueldo > 0 ? ((pagosMin + gFijos) / sueldo) * 100 : 0;

    // KPIs
    document.getElementById("kpiDisponible").innerText = "$" + disponible.toLocaleString("es-CO");
    document.getElementById("kpiDeuda").innerText = "$" + totalD.toLocaleString("es-CO");
    document.getElementById("kpiPorcentaje").innerText = porc.toFixed(0) + "%";

    // Consejos/Alertas
    let alertaCont = document.getElementById("alertas");
    if (porc > 70) alertaCont.innerHTML = "<div class='alerta alerta-mala'>🚨 ¡Cuidado! Gastas más del 70%. No uses tarjetas este mes.</div>";
    else alertaCont.innerHTML = "<div class='alerta alerta-buena'>✅ Vas por buen camino. Sigue así.</div>";

    // Simulación
    let labels = [], dataP = [], deudaSim = totalD, mes = 1;
    let simHtml = metodo === "snowball" ? "<b>Estrategia Bola de Nieve activa</b><br>" : "";
    
    while (deudaSim > 0 && disponible > 0 && mes <= 48) {
        deudaSim -= disponible;
        labels.push("Mes " + mes);
        dataP.push(Math.max(deudaSim, 0));
        mes++;
    }

    document.getElementById("resultado").innerHTML = `Tiempo estimado: <b>${mes-1} meses</b>.`;

    new Chart(document.getElementById("graficoDeuda"), {
        type: 'line',
        data: { labels, datasets: [{ label: 'Deuda Restante', data: dataP, borderColor: '#dc3545', fill: false }] }
    });
};

function cambiarMetodo() {
    document.getElementsByName("metodo").forEach(r => { if(r.checked) localStorage.setItem("metodo", r.value); });
    location.reload();
}

function volver() { window.location = "index.html"; }