let chartInstance = null;
window.onload = recalcular;

function recalcular() {
    const datos = JSON.parse(localStorage.getItem("datosDeudas"));
    if (!datos) return;

    let sBase = Number(datos.sueldo.replace(/\./g, "") || 0);
    let reservaVal = Number((datos.reserva || "0").replace(/\./g, "") || 0);
    let sMensual = datos.tipoIngreso === "quincenal" ? sBase * 2 : sBase;
    let gFijos = datos.gastos.reduce((a, b) => a + Number(b.valor.replace(/\./g, "") || 0), 0);

    let deudasSim = datos.deudas.filter(d => !d.estado).map(d => ({
        nombre: d.nombre, 
        monto: Number(d.monto.replace(/\./g, "") || 0), 
        pagoMin: Number(d.pago.replace(/\./g, "") || 0)
    }));

    let tDeudaInicial = deudasSim.reduce((a, b) => a + b.monto, 0);
    let tPagosM = deudasSim.reduce((a, b) => a + b.pagoMin, 0);
    
    // NUEVA LÓGICA: Restamos la reserva del disponible
    let disponibleTotal = sMensual - (tPagosM + gFijos);
    let extraParaDeuda = (disponibleTotal - reservaVal) > 0 ? (disponibleTotal - reservaVal) : 0;
    let porcentaje = sMensual > 0 ? ((tPagosM + gFijos) / sMensual) * 100 : 0;

    document.getElementById("kpiDisp").innerText = "$" + (disponibleTotal - extraParaDeuda).toLocaleString();
    document.getElementById("kpiDeuda").innerText = "$" + tDeudaInicial.toLocaleString();
    document.getElementById("kpiPorc").innerText = porcentaje.toFixed(0) + "%";
    
    lanzarConsejos(porcentaje);

    let metodo = document.querySelector('input[name="metodo"]:checked').value;
    if (metodo === "snowball") deudasSim.sort((a,b) => a.monto - b.monto);

    let labels = [], dataD = [], mes = 1;
    let tablaHtml = `<thead><tr><th>Mes</th><th>Pagar a...</th><th>Monto Pago</th><th>Saldo Restante</th></tr></thead><tbody>`;
    let saldoSimulado = tDeudaInicial;

    while (saldoSimulado > 0 && mes <= 120) { // Extendí a 120 meses por si el abono es pequeño
        let extraDelMes = extraParaDeuda;
        for(let d of deudasSim) {
            if(d.monto > 0) {
                let pagoEfectivo = Math.min(d.monto, d.pagoMin + extraDelMes);
                d.monto -= pagoEfectivo;
                extraDelMes = 0; 
                saldoSimulado = deudasSim.reduce((a,b)=>a+b.monto, 0);
                tablaHtml += `<tr><td>${mes}</td><td>${d.nombre}</td><td>$${pagoEfectivo.toLocaleString()}</td><td>$${saldoSimulado.toLocaleString()}</td></tr>`;
                break;
            }
        }
        labels.push("Mes " + mes); dataD.push(saldoSimulado);
        mes++;
        if (saldoSimulado <= 0) break;
    }

    document.getElementById("tablaAmortizacion").innerHTML = tablaHtml + "</tbody>";
    document.getElementById("resumenLibertad").innerText = `¡Libre de deudas en ${mes-1} meses! (Abonando $${extraParaDeuda.toLocaleString()} extra al mes)`;

    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(document.getElementById("graficoFinanciero"), {
        type: 'line',
        data: { labels, datasets: [{ label: 'Deuda Restante', data: dataD, borderColor: '#dc3545', fill: true, backgroundColor: 'rgba(220,53,69,0.1)', tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function lanzarConsejos(p) {
    let div = document.getElementById("alertas");
    if (p > 80) div.innerHTML = `<div class="alerta alerta-roja"><strong>🚨 Riesgo Crítico:</strong> Tus gastos y cuotas consumen el ${p.toFixed(0)}%. No deberías dejar reserva, abona todo lo posible.</div>`;
    else div.innerHTML = `<div class="alerta alerta-verde"><strong>✅ Plan Flexible:</strong> Estás usando el resto de tu dinero para tus gastos personales o ahorros mientras tus deudas bajan.</div>`;
}