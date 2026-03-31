let chartInstance = null;
window.onload = recalcular;

function recalcular() {
    const datos = JSON.parse(localStorage.getItem("datosDeudas"));
    if (!datos) return;

    let sBase = Number(datos.sueldo.replace(/\./g, "") || 0);
    let sMensual = datos.tipoIngreso === "quincenal" ? sBase * 2 : sBase;
    let gFijos = datos.gastos.reduce((a, b) => a + Number(b.valor.replace(/\./g, "") || 0), 0);

    // Clonar deudas para simular sin dañar los datos originales
    let deudasSim = datos.deudas.filter(d => !d.estado).map(d => ({
        nombre: d.nombre, 
        monto: Number(d.monto.replace(/\./g, "") || 0), 
        pagoMin: Number(d.pago.replace(/\./g, "") || 0)
    }));

    let tDeudaInicial = deudasSim.reduce((a, b) => a + b.monto, 0);
    let tPagosM = deudasSim.reduce((a, b) => a + b.pagoMin, 0);
    
    let disp = sMensual - (tPagosM + gFijos);
    let extraSobrante = disp > 0 ? disp : 0;
    let porcentaje = sMensual > 0 ? ((tPagosM + gFijos) / sMensual) * 100 : 0;

    // Actualizar KPIs e Interfaz
    document.getElementById("kpiDisp").innerText = "$" + disp.toLocaleString();
    document.getElementById("kpiDeuda").innerText = "$" + tDeudaInicial.toLocaleString();
    document.getElementById("kpiPorc").innerText = porcentaje.toFixed(0) + "%";
    
    lanzarConsejos(porcentaje);

    // Aplicar Estrategia
    let metodo = document.querySelector('input[name="metodo"]:checked').value;
    if (metodo === "snowball") deudasSim.sort((a,b) => a.monto - b.monto);

    // Simulación Mes a Mes
    let labels = [], dataD = [], mes = 1;
    let tablaHtml = `<thead><tr><th>Mes</th><th>Pagar a...</th><th>Monto Pago</th><th>Saldo Restante</th></tr></thead><tbody>`;
    let saldoSimulado = tDeudaInicial;

    while (saldoSimulado > 0 && mes <= 60) {
        let extraDelMes = extraSobrante;
        for(let d of deudasSim) {
            if(d.monto > 0) {
                let pagoEfectivo = Math.min(d.monto, d.pagoMin + extraDelMes);
                d.monto -= pagoEfectivo;
                extraDelMes = 0; // El extra solo se aplica a la deuda prioridad del mes
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
    document.getElementById("resumenLibertad").innerText = `¡Libre de deudas en ${mes-1} meses!`;

    // Gráfico
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(document.getElementById("graficoFinanciero"), {
        type: 'line',
        data: { labels, datasets: [{ label: 'Deuda Restante', data: dataD, borderColor: '#dc3545', fill: true, backgroundColor: 'rgba(220,53,69,0.1)', tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function lanzarConsejos(p) {
    let div = document.getElementById("alertas");
    if (p > 80) div.innerHTML = `<div class="alerta alerta-roja"><strong>🚨 Nivel Crítico (${p.toFixed(0)}%):</strong> Estás en zona de riesgo. No adquieras más deudas y aplica Bola de Nieve ya.</div>`;
    else if (p > 50) div.innerHTML = `<div class="alerta alerta-naranja"><strong>⚠️ Precaución (${p.toFixed(0)}%):</strong> Tu endeudamiento es alto. Trata de recortar gastos hormiga.</div>`;
    else div.innerHTML = `<div class="alerta alerta-verde"><strong>✅ Saludable (${p.toFixed(0)}%):</strong> Tienes buen control. El disponible puede acelerar tu libertad financiera.</div>`;
}