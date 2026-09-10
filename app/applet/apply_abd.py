with open('src/components/Transactions/ABDSection.tsx', 'r') as f:
    content = f.read()

idx = content.find('{/* Row 3: ABD Unit 1 */}')
idx_end = content.find('{/* Row 5: Paket Bundling Details */}')

new_block = """{/* Row 3: ABD Unit 1 */}
          <div className="space-y-3 bg-teal-50/50 p-4 rounded-2xl border border-teal-200 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-teal-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Alat Bantu Dengar Unit 1</span>
              </h4>
              <span className="text-[10px] text-teal-800 bg-teal-100/90 border border-teal-200 px-2.5 py-0.5 rounded-full font-bold">
                {fittingType}
              </span>
            </div>

            {/* Warning & Stock Alert Banner for Unit 1 */}
            {matchingStock1.length === 0 ? (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-start gap-2 text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-amber-950">⚠️ Peringatan Stok Kosong: </span>
                  Tipe <span className="font-bold underline">{isCustomModel1 ? customAbdModel1 || 'Kustom' : `${tipeABD1} (${modelABD1})`}</span> saat ini <span className="font-bold text-red-600">KOSONG (0 unit)</span> di Gudang {getBranchByCode(activeBranchCode).name}.
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex items-center justify-between text-emerald-900 text-xs">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Stok Sesuai Tersedia di Gudang {getBranchByCode(activeBranchCode).name}
                </span>
                <span className="bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                  {matchingStock1.length} Unit Siap
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipe ABD Katalog 1</label>
                <select
                  value={selectedAbdModel1}
                  onChange={(e) => handleAbdModel1Select(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                >
                  {ABD_PRICE_CATALOG.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.tipe} - {item.model} ({formatRupiah(item.harga)})
                    </option>
                  ))}
                  <option value="__CUSTOM__">+ Tipe Lain (Ketik Manual)</option>
                </select>
                {isCustomModel1 && (
                  <input
                    type="text"
                    required
                    placeholder="Ketik Tipe ABD..."
                    value={customAbdModel1}
                    onChange={(e) => setCustomAbdModel1(e.target.value)}
                    className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2 mt-1.5 text-xs font-bold text-slate-900"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Nomor Seri ABD 1</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setManualInputSN1(!manualInputSN1)}
                      className="text-[10px] text-teal-700 hover:text-teal-900 font-semibold underline"
                    >
                      {manualInputSN1 ? 'Pilih dari Stok' : 'Ketik Manual'}
                    </button>
                    {nomorSeriABD1 && (
                      <button
                        type="button"
                        onClick={() => setNomorSeriABD1('')}
                        className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                      >
                        Kosongkan
                      </button>
                    )}
                  </div>
                </div>

                {manualInputSN1 ? (
                  <input
                    type="text"
                    placeholder="Ketik Nomor Seri Manual..."
                    value={nomorSeriABD1}
                    onChange={(e) => setNomorSeriABD1(e.target.value)}
                    className="w-full bg-white border border-amber-400 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800"
                  />
                ) : (
                  <div className="relative">
                    <select
                      value={nomorSeriABD1}
                      onChange={(e) => handleSelectStock1(e.target.value)}
                      className={`w-full bg-white border rounded-xl p-2.5 text-xs font-mono font-bold appearance-none ${
                        nomorSeriABD1
                          ? 'border-teal-500 text-teal-950 bg-teal-50/40 ring-1 ring-teal-400'
                          : matchingStock1.length === 0
                          ? 'border-amber-300 bg-amber-50/30 text-slate-600'
                          : 'border-slate-300 text-slate-700'
                      }`}
                    >
                      <option value="">
                        {matchingStock1.length > 0
                          ? `-- Pilih No. Seri (${matchingStock1.length} unit tersedia) --`
                          : '-- (Nomor Seri Dikosongkan / Stok 0) --'}
                      </option>
                      {matchingStock1.length > 0 && (
                        <optgroup label={`Stok Sesuai Model (${matchingStock1.length} Unit)`}>
                          {matchingStock1.map((s) => (
                            <option key={s.noSeri} value={s.noSeri}>
                              {s.noSeri} - {s.tipeABD} {s.model}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {availableStock.filter((s) => !matchingStock1.some((m) => m.noSeri === s.noSeri)).length > 0 && (
                        <optgroup label="Stok Tipe Lain di Gudang">
                          {availableStock
                            .filter((s) => !matchingStock1.some((m) => m.noSeri === s.noSeri))
                            .map((s) => (
                              <option key={s.noSeri} value={s.noSeri}>
                                {s.noSeri} - {s.tipeABD} {s.model}
                              </option>
                            ))}
                        </optgroup>
                      )}
                      {nomorSeriABD1 && !availableStock.find((s) => s.noSeri === nomorSeriABD1) && (
                        <option value={nomorSeriABD1}>{nomorSeriABD1} (Manual)</option>
                      )}
                    </select>
                  </div>
                )}
                <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>No. Seri: <strong className="text-slate-800 font-mono">{nomorSeriABD1 || '(Kosong)'}</strong></span>
                  {matchingStock1.length === 0 && !nomorSeriABD1 && (
                    <span className="text-amber-700 font-bold">Stok Gudang Kosong</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Harga Unit 1 (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={hargaABD1}
                  onChange={(e) => setHargaABD1(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-teal-800"
                />
              </div>
            </div>
          </div>

          {/* Row 4: ABD Unit 2 (Only if Binaural) */}
          {fittingType === 'Binaural' && (
            <div className="space-y-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-200 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-purple-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-purple-700" />
                  <span>Alat Bantu Dengar Unit 2 (Pasangan Binaural)</span>
                </h4>
                <span className="text-[10px] text-purple-800 bg-purple-100/90 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold">
                  Telinga Kedua
                </span>
              </div>

              {/* Warning & Stock Alert Banner for Unit 2 */}
              {matchingStock2.length === 0 ? (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-start gap-2 text-amber-900 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold text-amber-950">⚠️ Peringatan Stok Kosong: </span>
                    Tipe <span className="font-bold underline">{isCustomModel2 ? customAbdModel2 || 'Kustom' : `${tipeABD2} (${modelABD2})`}</span> saat ini <span className="font-bold text-red-600">KOSONG (0 unit)</span> di Gudang {getBranchByCode(activeBranchCode).name}.
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex items-center justify-between text-emerald-900 text-xs">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Stok Sesuai Tersedia di Gudang {getBranchByCode(activeBranchCode).name}
                  </span>
                  <span className="bg-purple-700 text-white font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                    {matchingStock2.length} Unit Siap
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe ABD Katalog 2</label>
                  <select
                    value={selectedAbdModel2}
                    onChange={(e) => handleAbdModel2Select(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                  >
                    {ABD_PRICE_CATALOG.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.tipe} - {item.model} ({formatRupiah(item.harga)})
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Tipe Lain (Ketik Manual)</option>
                  </select>
                  {isCustomModel2 && (
                    <input
                      type="text"
                      required
                      placeholder="Ketik Tipe ABD 2..."
                      value={customAbdModel2}
                      onChange={(e) => setCustomAbdModel2(e.target.value)}
                      className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2 mt-1.5 text-xs font-bold text-slate-900"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Nomor Seri ABD 2</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setManualInputSN2(!manualInputSN2)}
                        className="text-[10px] text-purple-700 hover:text-purple-900 font-semibold underline"
                      >
                        {manualInputSN2 ? 'Pilih dari Stok' : 'Ketik Manual'}
                      </button>
                      {nomorSeriABD2 && (
                        <button
                          type="button"
                          onClick={() => setNomorSeriABD2('')}
                          className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                        >
                          Kosongkan
                        </button>
                      )}
                    </div>
                  </div>

                  {manualInputSN2 ? (
                    <input
                      type="text"
                      placeholder="Ketik Nomor Seri Manual Unit 2..."
                      value={nomorSeriABD2}
                      onChange={(e) => setNomorSeriABD2(e.target.value)}
                      className="w-full bg-white border border-purple-400 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800"
                    />
                  ) : (
                    <div className="relative">
                      <select
                        value={nomorSeriABD2}
                        onChange={(e) => handleSelectStock2(e.target.value)}
                        className={`w-full bg-white border rounded-xl p-2.5 text-xs font-mono font-bold appearance-none ${
                          nomorSeriABD2
                            ? 'border-purple-500 text-purple-950 bg-purple-50/40 ring-1 ring-purple-400'
                            : matchingStock2.length === 0
                            ? 'border-amber-300 bg-amber-50/30 text-slate-600'
                            : 'border-slate-300 text-slate-700'
                        }`}
                      >
                        <option value="">
                          {matchingStock2.length > 0
                            ? `-- Pilih No. Seri (${matchingStock2.length} unit tersedia) --`
                            : '-- (Nomor Seri Dikosongkan / Stok 0) --'}
                        </option>
                        {matchingStock2.length > 0 && (
                          <optgroup label={`Stok Sesuai Model (${matchingStock2.length} Unit)`}>
                            {matchingStock2.map((s) => (
                              <option key={s.noSeri} value={s.noSeri}>
                                {s.noSeri} - {s.tipeABD} {s.model}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {availableStock
                          .filter((s) => s.noSeri !== nomorSeriABD1 && !matchingStock2.some((m) => m.noSeri === s.noSeri))
                          .length > 0 && (
                          <optgroup label="Stok Tipe Lain di Gudang">
                            {availableStock
                              .filter((s) => s.noSeri !== nomorSeriABD1 && !matchingStock2.some((m) => m.noSeri === s.noSeri))
                              .map((s) => (
                                <option key={s.noSeri} value={s.noSeri}>
                                  {s.noSeri} - {s.tipeABD} {s.model}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {nomorSeriABD2 && !availableStock.find((s) => s.noSeri === nomorSeriABD2) && (
                          <option value={nomorSeriABD2}>{nomorSeriABD2} (Manual)</option>
                        )}
                      </select>
                    </div>
                  )}
                  <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>No. Seri: <strong className="text-slate-800 font-mono">{nomorSeriABD2 || '(Kosong)'}</strong></span>
                    {matchingStock2.length === 0 && !nomorSeriABD2 && (
                      <span className="text-amber-700 font-bold">Stok Gudang Kosong</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Unit 2 (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={hargaABD2}
                    onChange={(e) => setHargaABD2(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-purple-800"
                  />
                </div>
              </div>
            </div>
          )}
          """

new_content = content[:idx] + new_block + content[idx_end:]
with open('src/components/Transactions/ABDSection.tsx', 'w') as f:
    f.write(new_content)

print('Updated successfully!')
