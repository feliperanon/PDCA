// ...dentro do componente PdcaDashboardPage, depois do <PdcaListWithFilters ... />

      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">Linha do tempo da cultura PDCA</h2>

        {/* Criados nos últimos 7 dias */}
        <TimelineSection
          title="PDCAs criados nos últimos 7 dias"
          items={getPdcasCreatedLastDays(pdcas, 7)}
        />

        {/* Padronizados neste mês */}
        <TimelineSection
          title="PDCAs padronizados neste mês"
          items={getPdcasStandardizedThisMonth(pdcas)}
        />

        {/* Voltaram para Plan (ex.: statusAnterior = 'Executando' e status = 'Planejando') */}
        <TimelineSection
          title="PDCAs que voltaram para Plan"
          items={getPdcasBackToPlan(pdcas)}
        />
      </div>
