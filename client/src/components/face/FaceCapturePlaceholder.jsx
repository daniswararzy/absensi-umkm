function FaceCapturePlaceholder() {
  return (
    <section
      className="grid content-start gap-5 rounded-[var(--radius-md)] border border-brand-border bg-brand-white p-6 shadow-[var(--shadow-soft)]"
      aria-label="Placeholder kamera absensi"
    >
      <div className="grid aspect-[4/3] place-items-center rounded-[var(--radius-md)] border border-dashed border-[#f1d37a] bg-brand-yellow-soft">
        <div
          className="aspect-square w-[42%] rounded-[var(--radius-md)] border-[3px] border-brand-yellow bg-brand-white shadow-[var(--shadow-subtle)]"
          aria-hidden="true"
        ></div>
      </div>
      <div>
        <h3 className="mb-2 text-xl leading-snug text-brand-brown">Area kamera</h3>
        <p className="mb-0 text-brand-brown-muted">
          Placeholder ini menandai posisi webcam, deteksi wajah, dan instruksi
          pengguna saat integrasi face-api.js dilakukan.
        </p>
      </div>
    </section>
  )
}

export default FaceCapturePlaceholder
