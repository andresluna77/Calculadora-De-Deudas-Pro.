let chartInstance = null;

// Se ejecuta al cargar la página de resultados
window.onload = function() {
    recalcular();
};

function recalcular() {
    const datos = JSON.parse(localStorage.getItem("datosDeudas"));
    if (!datos) return;

    // 1. Limpieza y Conversión de Datos
    let sBase = Number(datos.sueldo.replace(/\./g, "") || 0);
    let abonoManual = Number((datos.abonoVoluntario || "0").replace(/\./g, "") || 0);
    let esQuincenal = datos.tipoIngreso === "quincenal";
    
    // Convertimos a base mensual para los indicadores de salud (KPIs)
    let sMensual = esQuincenal ? sBase * 2 : sBase;
    let gFijosMensuales = datos.gastos.reduce((a, b) => a + Number(b.valor.replace(/\./g, "") || 0), 0);

    // Clonamos las deudas pendientes para la simulación
    let deudasSim = datos.deudas.filter(d => !d.estado).map(d => ({
        nombre: d.nombre, 
        monto: Number(d.monto.replace(/\./g, "") || 0), 
        pagoMin: Number(d.pago.replace(/\./g, "") || 0)
    }));

    let tDeudaInicial = deudasSim.reduce((a, b) => a + b.monto, 0);
    let tPagosM = deudasSim.reduce((a, b) => a + b.pagoMin, 0);
    
    // Disponibilidad mensual (lo que sobra después de gastos y mínimos)
    let disponibleMensual = sMensual - (tPagosM + gFijosMensuales);
    let porcentajeEndeudamiento = sMensual > 0 ? ((tPagosM + gFijosMensuales) / sMensual) * 100 : 0;

    // 2. Actualizar KPIs en pantalla
    document.getElementById("kpiDisp").innerText = "$" + disponibleMensual.toLocaleString();
    document.getElementById("kpiDeuda").innerText = "$" + tDeudaInicial.toLocaleString();
    document.getElementById("kpiPorc").innerText = porcentajeEndeudamiento.toFixed(0) + "%";
    
    lanzarConsejos(porcentajeEndeudamiento, abonoManual, disponibleMensual);

    // 3. Aplicar Estrategia Seleccionada
    let metodo = document.querySelector('input[name="metodo"]:checked').value;
    if (metodo === "snowball") {
        deudasSim.sort((a,b) => a.monto - b.monto);
    }

    // 4. Configuración de Ciclos (Mes vs Quincena)
    let factorCiclo = esQuincenal ? 2 : 1;
    let textoCiclo = esQuincenal ? "Quincena" : "Mes";
    let limitePasos = esQuincenal ? 240 : 120; // Evitar bucles infinitos (10 años máx)

    let labels = ["Inicio"], dataD = [tDeudaInicial], paso = 1;
    let tablaHtml = `<thead><tr><th>${textoCiclo}</th><th>Prioridad</th><th>Pago Aplicado</th><th>Saldo Restante</th></tr></thead><tbody>`;
    let saldoSimulado = tDeudaInicial;

    // 5. Simulación del Plan de Pagos
    while (saldoSimulado > 0 && paso <= limitePasos) {
        // El abono extra manual se reparte en el ciclo (si es quincenal, la mitad cada vez)
        let extraDeEstePaso = abonoManual / factorCiclo;
        
        for(let d of deudasSim) {
            if(d.monto > 0) {
                // Pago del paso = (Mínimo mensual / factor) + (Abono extra definido por usuario)
                let pagoDeEstePaso = Math.min(d.monto, (d.pagoMin / factorCiclo) + extraDeEstePaso);
                d.monto -= pagoDeEstePaso;
                
                // El abono extra solo se aplica a la deuda prioritaria en este ciclo
                extraDeEstePaso = 0; 
                
                saldoSimulado = deudasSim.reduce((a,b)=>a+b.monto, 0);
                
                tablaHtml += `<tr>
                    <td>${textoCiclo} ${paso}</td>
                    <td>${d.nombre}</td>
                    <td>$${pagoDeEstePaso.toLocaleString()}</td>
                    <td>$${saldoSimulado.toLocaleString()}</td>
                </tr>`;
                break;
            }
        }
        labels.push(textoCiclo.charAt(0) + paso); 
        dataD.push(saldoSimulado);
        paso++;
        if (saldoSimulado <= 0) break;
    }

    document.getElementById("tablaAmortizacion").innerHTML = tablaHtml + "</tbody>";
    
    // Cálculo final del tiempo para el resumen
    let mesesTotales = esQuincenal ? Math.ceil((paso-1)/2) : (paso-1);
    let resumenTexto = `¡Estarás libre en aproximadamente ${mesesTotales} meses!`;
    if(esQuincenal) resumenTexto += ` (${paso-1} quincenas en total)`;
    
    document.getElementById("resumenLibertad").innerText = resumenTexto;

    // 6. Renderizar Gráfica
    const ctx = document.getElementById('graficoFinanciero').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Saldo de la Deuda',
                data: dataD,
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: { callback: (value) => '$' + value.toLocaleString() }
                }
            },
            plugins: {
                legend: { display: true, position: 'top' }
            }
        }
    });
}

function lanzarConsejos(p, abono, disp) {
    let div = document.getElementById("alertas");
    if (abono > disp) {
        div.innerHTML = `<div class="alerta alerta-roja"><strong>⚠️ Alerta de Flujo:</strong> Tu abono extra de $${abono.toLocaleString()} es mayor a lo que te sobra ($${disp.toLocaleString()}). Podrías quedarte sin efectivo para el diario.</div>`;
    } else if (abono === 0) {
        div.innerHTML = `<div class="alerta alerta-naranja"><strong>💡 Consejo Financiero:</strong> Estás pagando solo los mínimos. Un abono pequeño, aunque sea de $20.000, reduciría meses de intereses.</div>`;
    } else {
        let ahorroFinal = disp - abono;
        div.innerHTML = `<div class="alerta alerta-verde"><strong>✅ Plan Equilibrado:</strong> Abonas $${abono.toLocaleString()} extra y aún te quedan $${ahorroFinal.toLocaleString()} libres cada mes para otros gastos o ahorro.</div>`;
    }
}