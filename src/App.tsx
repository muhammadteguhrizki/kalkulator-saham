import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

type CalculatorForm = {
  lotLama: string;
  avgLama: string;
  lotTambah: string;
  hargaTambah: string;
  hargaJual: string;
  feeJual: string;
};

type TradingViewWidgetProps = {
  scriptSrc: string;
  config: Record<string, unknown>;
  className?: string;
};

const PAJAK_JUAL_SAHAM = 0.1;

function TradingViewWidget({
  scriptSrc,
  config,
  className = "",
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    container.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = scriptSrc;
    script.async = true;
    script.innerHTML = JSON.stringify(config);

    container.appendChild(widgetContainer);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [scriptSrc, config]);

  return (
    <div
      ref={containerRef}
      className={`tradingview-widget-container ${className}`}
    />
  );
}

function parseNumber(value: string): number {
  let text = String(value).trim();

  if (!text) return 0;

  text = text.replace(/[^\d.,]/g, "");

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");

  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      text = text.replace(/\./g, "").replace(",", ".");
    } else {
      text = text.replace(/,/g, "");
    }
  } else if (lastComma > -1) {
    text = text.replace(",", ".");
  }

  return Number.parseFloat(text) || 0;
}

function formatRupiah(value: number, decimal = 0): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
  }).format(value);
}

function formatAngka(value: number, decimal = 0): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
  }).format(value);
}

export default function App() {
  const [form, setForm] = useState<CalculatorForm>({
    lotLama: "",
    avgLama: "",
    lotTambah: "",
    hargaTambah: "",
    hargaJual: "",
    feeJual: "0.25",
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = (): void => {
    setForm({
      lotLama: "",
      avgLama: "",
      lotTambah: "",
      hargaTambah: "",
      hargaJual: "",
      feeJual: "0.25",
    });
  };

  const lotLama = parseNumber(form.lotLama);
  const avgLama = parseNumber(form.avgLama);
  const lotTambah = parseNumber(form.lotTambah);
  const hargaTambah = parseNumber(form.hargaTambah);
  const hargaJual = parseNumber(form.hargaJual);
  const feeJual = parseNumber(form.feeJual);

  const lembarLama = lotLama * 100;
  const lembarTambah = lotTambah * 100;
  const totalLembar = lembarLama + lembarTambah;
  const totalLot = lotLama + lotTambah;

  const modalLama = lembarLama * avgLama;
  const modalTambah = lembarTambah * hargaTambah;
  const totalModal = modalLama + modalTambah;

  const avgBaru = totalLembar > 0 ? totalModal / totalLembar : 0;

  const grossJual = hargaJual > 0 ? totalLembar * hargaJual : 0;
  const feeBroker = grossJual * (feeJual / 100);
  const pajakJual = grossJual * (PAJAK_JUAL_SAHAM / 100);
  const biayaJual = feeBroker + pajakJual;
  const netJual = grossJual - biayaJual;

  const profitLoss = hargaJual > 0 ? netJual - totalModal : 0;

  const persenProfit =
    totalModal > 0 && hargaJual > 0 ? (profitLoss / totalModal) * 100 : 0;

  const statusProfit =
    profitLoss > 0 ? "profit" : profitLoss < 0 ? "loss" : "netral";

  const ihsgConfig = useMemo(
    () => ({
      symbol: "IDX:COMPOSITE",
      width: "100%",
      colorTheme: "light",
      isTransparent: true,
      locale: "id",
    }),
    [],
  );

  const tickerConfig = useMemo(
    () => ({
      symbols: [
        {
          proName: "IDX:COMPOSITE",
          title: "IHSG",
        },
        {
          proName: "FOREXCOM:NAS100",
          title: "Nasdaq 100",
        },
        {
          proName: "FOREXCOM:SPXUSD",
          title: "S&P 500",
        },
        {
          proName: "BITSTAMP:BTCUSD",
          title: "Bitcoin",
        },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "light",
      locale: "id",
    }),
    [],
  );

  return (
    <main className="container">
      <section className="card">
        <div className="header">
          <h1>Kalkulator Average Saham</h1>
        </div>

        <div className="market-box">
          <TradingViewWidget
            scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js"
            config={ihsgConfig}
          />

          <TradingViewWidget
            className="ticker-wrap"
            scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
            config={tickerConfig}
          />
        </div>

        <div className="grid">
          <label>
            <span>Lot Lama</span>
            <input
              type="number"
              name="lotLama"
              value={form.lotLama}
              onChange={handleChange}
              inputMode="numeric"
              placeholder="Contoh: 10"
            />
          </label>

          <label>
            <span>Avg Lama</span>
            <input
              type="text"
              name="avgLama"
              value={form.avgLama}
              onChange={handleChange}
              inputMode="decimal"
              placeholder="Contoh: 100"
            />
          </label>

          <label>
            <span>Lot Tambah</span>
            <input
              type="number"
              name="lotTambah"
              value={form.lotTambah}
              onChange={handleChange}
              inputMode="numeric"
              placeholder="Contoh: 30"
            />
          </label>

          <label>
            <span>Harga Tambah</span>
            <input
              type="text"
              name="hargaTambah"
              value={form.hargaTambah}
              onChange={handleChange}
              inputMode="decimal"
              placeholder="Contoh: 150"
            />
          </label>

          <label>
            <span>Harga Jual</span>
            <input
              type="text"
              name="hargaJual"
              value={form.hargaJual}
              onChange={handleChange}
              inputMode="decimal"
              placeholder="Contoh: 250"
            />
          </label>

          <label>
            <span>Fee Jual Broker (%)</span>
            <input
              type="text"
              name="feeJual"
              value={form.feeJual}
              onChange={handleChange}
              inputMode="decimal"
              placeholder="Contoh: 0.25"
            />
          </label>
        </div>

        <div className="button-group">
          <button type="button" className="secondary" onClick={resetForm}>
            Reset
          </button>
        </div>

        <div className="result-box">
          <p>Avg Baru</p>
          <h2>{formatRupiah(avgBaru, 2)}</h2>
        </div>

        <div className="detail">
          <div>
            <span>Total Lot</span>
            <strong>{formatAngka(totalLot)} lot</strong>
          </div>

          <div>
            <span>Total Lembar</span>
            <strong>{formatAngka(totalLembar)} lembar</strong>
          </div>

          <div>
            <span>Total Modal</span>
            <strong>{formatRupiah(totalModal)}</strong>
          </div>
        </div>

        <div className="detail">
          <div>
            <span>Gross Penjualan</span>
            <strong>{formatRupiah(grossJual)}</strong>
          </div>

          <div>
            <span>Fee Broker</span>
            <strong>{formatRupiah(feeBroker)}</strong>
          </div>

          <div>
            <span>Pajak Jual</span>
            <strong>{formatRupiah(pajakJual)}</strong>
          </div>
        </div>

        <div className="detail">
          <div>
            <span>Net Penjualan</span>
            <strong>{formatRupiah(netJual)}</strong>
          </div>

          <div>
            <span>Profit / Loss</span>
            <strong className={statusProfit}>{formatRupiah(profitLoss)}</strong>
          </div>

          <div>
            <span>Persentase</span>
            <strong className={statusProfit}>
              {formatAngka(persenProfit, 2)}%
            </strong>
          </div>
        </div>

        <p className="note-biaya">
          Pajak jual default: {PAJAK_JUAL_SAHAM}% • Fee broker bisa diubah.
        </p>
      </section>
    </main>
  );
}
