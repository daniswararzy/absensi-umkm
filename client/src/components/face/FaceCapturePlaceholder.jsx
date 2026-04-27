function FaceCapturePlaceholder() {
  return (
    <section className="face-placeholder" aria-label="Placeholder kamera absensi">
      <div className="camera-frame">
        <div className="camera-target" aria-hidden="true"></div>
      </div>
      <div>
        <h3>Area kamera</h3>
        <p>
          Placeholder ini menandai posisi webcam, deteksi wajah, dan instruksi
          pengguna saat integrasi face-api.js dilakukan.
        </p>
      </div>
    </section>
  )
}

export default FaceCapturePlaceholder
