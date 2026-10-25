const fs = require("fs");
const path = require("path");
const os = require("os");
const { randomUUID } = require("crypto");
const { spawn, spawnSync } = require("child_process");
const { StorageUploadError, LocketAPIError } = require("../exceptions");

let sharp = null;
try { sharp = require("sharp"); } catch (e) { sharp = null; }

class NoteType {
  static STANDARD = "standard";
  static REVIEW = "review";
  static MUSIC = "music";
  static LOCATION = "location";
  static WEATHER = "weather";
  static TIME = "time";
  static STREAK = "streak";
  static STAR_SIGN = "star_sign";
  static POLL = "poll";
  static LOCKET_COUNT = "locket_count";
  static COLORS = "colors";
  static HALLOWEEN_2026 = "halloween_2026";
  static CHRISTMAS_EVE_2026 = "christmas_eve_2026";
  static CHRISTMAS_DAY_2026 = "christmas_day_2026";
  static NEW_YEARS_EVE_2026 = "new_years_eve_2026";
  static NEW_YEARS_DAY_2027 = "new_years_day_2027";
  static NEW_YEARS_DAY_2027_ALTERNATE = "new_years_day_2027_alternate";
  static AUTUMN_2026 = "autumn_2026";
  static COLOR_PALETTE = "color_palette";
  static PARTY_TIME = "party_time";
  static GOOD_MORNING = "good_morning";
  static GOODNIGHT = "goodnight";
  static OOTD = "ootd";
  static MISS_YOU = "miss_you";
  static TOI_NHO_EM = "toi_nho_em";
  static DOI_ROI = "custom_4281443912454362723";
  static DANG_BAN_TUONG_TU = "custom_4278420056830692855";
  static REP_TIN_NHAN_DI = "custom_-5230082930652109611";
  static MO_HON_NHUNG_TAM_HIEN = "custom_-3194172128167113174";
  static MUON_DUOC_OM = "custom_951140262642706115";
  static HOI_BI_NHO = "custom_-2517074947356721928";
  static DANG_GHEN = "custom_8704346769822013791";
  static NGU_NGON_GIAC_MO_CO_EM = "custom_-6322769402934766020";
  static HAO_HAN = "custom_-7748601173102319221";
  static CAM_LANH = "custom_5086729225261087312";
  static BAT_LUC = "custom_-8827799067762644667";
  static XIN_LUI_DUOC_CHUA = "custom_1207712346050008572";
  static ROT_NUOC_MAT = "custom_7843091339669964287";
  static GUC_NGA = "custom_-6209580156274658388";
  static TIEN_DINH = "custom_2624241615109400076";
  static CHE_MANH = "custom_6333530155972530884";
  static XINH_GAI_AN_PHIM_1 = "custom_5236262895016786086";
  static DI_LAM_VI_DAM_ME = "custom_4629360466318251663";
  static YEUU_EMM = "custom_2356683405459396780";
  static YEUU_ANHH = "custom_-156517413958162274";
  static HOI_CHIEU_TROI_MUA = "custom_-1002616293585878253";
  static CON_VIEN_LA_LAN = "custom_2988924028358029735";
  static AIIII_HOIIII = "custom_-776650182805465343";
  static TAI_ONG_DE_NGOAI_DAU_A = "custom_8807240841082552583";
  static CHAN_BO_MAY_DI = "custom_9142722434980417998";
  static OACH_XA_LACH = "custom_-2275483743616875628";
  static E_HE = "custom_-1964354746873974650";
  static UA_ALO = "custom_-8051687911840908357";
  static MAY_CHU_LA_DU_DU = "custom_5306143805773536410";
  static LANH_THAY_ME = "custom_8500361098265117961";
  static DAY_LA_CAI_VIEC = "custom_9196689374819632769";
  static DEP_TRAI_AN_PHIM_2 = "custom_-1593423561129370554";
  static NHO_ANH_CH = "custom_1826983258186006295";
  static BIEN_OI_HUUUUUUU = "custom_-7090905829866915796";
  static YEU_ME = "custom_5774090202020534389";
  static NHO_NGY = "custom_158060084751342837";
  static OAN_TA_LA_VAN = "custom_-8740976725662466401";
  static KHA_NANG_CAO = "custom_2881592073605293252";
  static O_QUA_KIEU = "custom_530435604131815207";
  static LANH_NHO_AI = "custom_3095077949020722512";
  static DUNG_NHANG_NHIT = "custom_-1835481008846003750";
  static HOM_NAY_TOI_BUON = "custom_2800157096924376465";
  static GAP_NHAU_CAI_NHI = "custom_-1606761404320333220";
  static ANK_IU_EIM = "custom_-985711000650511532";
  static MONG_TON_HOA_SEN_THAY_CANH_NAY = "custom_8417033934333284867";
  static DAM_NHAU_KHONG = "custom_-8088027983880581018";
  static SIEU_CAP_BA_KHI = "custom_2329667605952175965";
  static DU_AN_MA = "custom_-3231089972810420922";
  static DOC_SO_TAI_KHOAN = "custom_5553591653597204903";
  static AI_SO_THI_DI_VE = "custom_-666096677004943582";
  static CON_CAI_NIT = "custom_-3548848387881782452";
  static CANH_BAO_CO_HAT = "custom_1285814533953315227";
  static THAN_CHUA_MA_DON = "custom_-7627856025199367222";
  static AI_MUON = "custom_1443622437168042269";
  static HAY_RA_DE_QUA_A = "custom_2923223443268332123";
  static GIAM_SUC_MANH_CON_TUONG_NAY = "custom_5807806141447560156";
  static MAC_CO_QUA_HAI_OI = "custom_7816289860114210553";
  static MINH_LA_LOP = "custom_-5360614187519837840";
  static DEP_TRAI_CO_GI_SAI = "custom_-6998405490882227027";
  static FEELING_CUTE = "feeling_cute";
  static CU = "cu";
  static WEDDING_TIME = "wedding_time";
  static CAM_THAY_HANH_PHUC = "cam_thay_hanh_phuc";
  static COFFEE_TIME = "coffee_time";
  static SNAKE_VIBES = "snake_vibes";
  static MIXUE_TIME = "mixue_time";
  static LOCKET_TIME = "locket_time";
  static CINEMA_TIME = "cinema_time";
  static DATING_TIME = "dating_time";
  static GRADUATION_DAY = "graduation_day";
  static SHOPPING_TIME = "shopping_time";
  static DINNER_TIME = "dinner_time";
  static CHILLING_TIME = "chilling_time";
  static XIN_VINH_BIET_CU = "xin_vinh_biet_cu";
  static CHAY_NGAY_DI = "chay_ngay_di";
  static CU_TU_TU_KHOAI_SE_NHU = "cu_tu_tu_khoai_se_nhu";
  static KIEM_TRA_NHAN_PHAM = "kiem_tra_nhan_pham";
  static DOC_SO_TAI_KHOAN_2 = "doc_so_tai_khoan";
  static AI_SO_THI_DI_VE_2 = "ai_so_thi_di_ve";
  static CON_CAI_NIT_2 = "con_cai_nit";
  static CANH_BAO_CO_HAT_2 = "canh_bao_co_hat";
  static THAN_CHUA_MA_DON_2 = "than_chua_ma_don";
  static AI_MUON_2 = "ai_muon";
  static HAY_RA_DE_QUA_A_2 = "hay_ra_de_qua_a";
  static GIAM_SUC_MANH_CON_TUONG = "giam_suc_manh_con_tuong";
  static MAC_CO_QUA_HAI_OI_2 = "mac_co_qua_hai_oi";
  static MINH_LA_LOP_2 = "minh_la_lop";
  static DEP_TRAI_CO_GI_SAI_2 = "dep_trai_co_gi_sai";
  static MONG_TON_HOA_SEN = "mong_ton_hoa_sen";
  static DAM_NHAU_KHONG_2 = "dam_nhau_khong";
  static SIEU_CAP_BA_KHI_2 = "sieu_cap_ba_khi";
  static DU_AN_MA_2 = "du_an_ma";
  static HOI_CHIEU_TROI_MUA_2 = "hoi_chieu_troi_mua";
  static TUYET_DOI_KHONG_NGHE = "tuyet_doi_khong_nghe";
  static FLEX_DEN_HOI_THO_CUOI = "flex_den_hoi_tho_cuoi";
  static OVERTHINKING_VAI_CHUONG = "overthinking_vai_chuong";
  static KE_CHUYEN_NGHE_CHOI = "ke_chuyen_nghe_choi";
  static XINH_DEP_TUYET_VOI = "xinh_dep_tuyet_voi";
  static TRAM_CAM_NHE = "tram_cam_nhe";
  static CHUA_DU_WOW = "chua_du_wow";
  static BOC_TRUNG_SIT_RIT = "boc_trung_sit_rit";
  static HEN_LAM_MOI_XUI_DUOC_VAY_A = "hen_lam_moi_xui_duoc_vay_a";
  static RA_DUONG_NE_MOI_ANH = "ra_duong_ne_moi_anh";
  static CUNG_CUNG_DI = "cung_cung_di";
  static TUYET_DOI_DIEN_ANH = "tuyet_doi_dien_anh";
  static DU_BA_KHI_CHUA = "du_ba_khi_chua";
  static UA_ALO_2 = "ua_alo";
  static CAI_GI_VAY_TROI = "cai_gi_vay_troi";
  static NAY_LA_HET_CUU = "nay_la_het_cuu";
  static QUA_LA_DIEN_ANH = "qua_la_dien_anh";
  static CUOI_XIU = "cuoi_xiu";
  static TOANG_THAT_ROI = "toang_that_roi";
  static TOI_ROI_TOI_ROI = "toi_roi_toi_roi";
  static KHONG_THE_TIN_NOI = "khong_the_tin_noi";
  static NGAY_MOI_VUI_VE = "ngay_moi_vui_ve";
  static NGU_NGON = "ngu_ngon";
  static AN_COM_CHUA = "an_com_chua";
  static DI_CHOI_KHONG = "di_choi_khong";
  static TINH_HOA_HOI_TU = "tinh_hoa_hoi_tu";
  static PHU_TINH_KHONG_PHU_BAN = "phu_tinh_khong_phu_ban";
  static NGOAN_XINH_YEU = "ngoan_xinh_yeu";
  static NHIN_LA_BIET_UY_TIN = "nhin_la_biet_uy_tin";
  static LUON_VUI_TUOI = "luon_vui_tuoi";
  static BAT_ON_THAT_SU = "bat_on_that_su";
  static KHONG_CAM_XUC = "khong_cam_xuc";
  static PHU_HUYNH_DUNG_XEM = "phu_huynh_dung_xem";
  static CHECK_VAR = "check_var";
  static QUA_NHIEU_SU_DE_THUONG = "qua_nhieu_su_de_thuong";
  static MAC_BAY_TINH_YEU = "mac_bay_tinh_yeu";
  static SONG_GIO_PHU_DOI_TRAI = "song_gio_phu_doi_trai";
  static DEADLINE_RUOT = "deadline_ruot";
  static TIEN_DAU_MA_TIEU = "tien_dau_ma_tieu";
  static NGHIEN_CUU_KHOA_HOC = "nghien_cuu_khoa_hoc";
}

class MomentsModule {
  static STORAGE_IMG_URL = "https://firebasestorage.googleapis.com/v0/b/locket-img/o";
  static STORAGE_VIDEO_URL = "https://firebasestorage.googleapis.com/v0/b/locket-video/o";

  constructor(client) {
    this.client = client;
  }

  _getHistoryFile() {
    const uid = (this.client.session && this.client.session.uid) || "default";
    const filename = `my_moments_${uid}.json`;
    const sessionPath = (this.client.session && this.client.session.sessionPath) || "";
    if (sessionPath && path.dirname(sessionPath)) {
      return path.join(path.dirname(sessionPath), filename);
    }
    return filename;
  }

  _loadHistory() {
    const filepath = this._getHistoryFile();
    const uid = (this.client.session && this.client.session.uid) || "default";
    const candidates = [filepath, `my_moments_${uid}.json`, path.join("..", `my_moments_${uid}.json`)];
    for (const p of candidates) {
      if (p && fs.existsSync(p)) {
        try {
          const data = JSON.parse(fs.readFileSync(p, "utf-8"));
          if (Array.isArray(data)) return data;
        } catch (e) {}
      }
    }
    return [];
  }

  _saveHistory(history) {
    const filepath = this._getHistoryFile();
    try { fs.writeFileSync(filepath, JSON.stringify(history, null, 2), "utf-8"); } catch (e) {}
  }

  recordPostedMoment(momentData) {
    if (!momentData || typeof momentData !== "object") return;
    const mid = momentData.canonical_uid || momentData.id;
    if (!mid) return;
    let history = this._loadHistory();
    history = history.filter(m => (m.canonical_uid || m.id) !== mid);
    history.unshift(momentData);
    this._saveHistory(history);
  }

  static _randomId(length = 20) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  async _convertToWebp(imageData, quality = 85) {
    if (sharp) {
      try {
        const img = sharp(imageData);
        const meta = await img.metadata();
        const conv = (meta.hasAlpha) ? img.toFormat("webp", { quality }) : img.toFormat("webp", { quality });
        return await conv.toBuffer();
      } catch (e) {}
    }
    return Buffer.from(imageData);
  }

  async extractThumbnail(videoInput, timestampSec = 1.0) {
    let ffmpegBin = null;
    try { ffmpegBin = require("imageio-ffmpeg").getFfmpegExe(); } catch (e) {}
    if (!ffmpegBin) ffmpegBin = "ffmpeg";

    let tempIn = null;
    let tempOut = null;
    try {
      let inPath = videoInput;
      if (typeof videoInput === "string" && (videoInput.startsWith("http://") || videoInput.startsWith("https://"))) {
        const parsed = new URL(videoInput);
        const origin = `${parsed.protocol}//${parsed.host}/`;
        let resp = await fetch(videoInput, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36", Accept: "*/*", Referer: origin } });
        if (resp.status !== 200) resp = await fetch(videoInput);
        if (resp.status === 200) {
          const ab = await resp.arrayBuffer();
          const fd = fs.openSync(tempIn = path.join(os.tmpdir(), `vin_${Date.now()}.mp4`), "w");
          fs.writeSync(fd, Buffer.from(ab));
          fs.closeSync(fd);
          inPath = tempIn;
        } else {
          inPath = videoInput;
        }
      } else if (Buffer.isBuffer(videoInput) || videoInput instanceof Uint8Array) {
        tempIn = path.join(os.tmpdir(), `vin_${Date.now()}.mp4`);
        fs.writeFileSync(tempIn, Buffer.from(videoInput));
        inPath = tempIn;
      }

      tempOut = path.join(os.tmpdir(), `vout_${Date.now()}.jpg`);
      const args = [ffmpegBin, "-y", "-ss", String(timestampSec), "-i", inPath, "-vframes", "1", "-q:v", "2", tempOut];
      spawnSync(args[0], args.slice(1), { stdio: "ignore" });

      if (fs.existsSync(tempOut) && fs.statSync(tempOut).size > 0) {
        const jpgBytes = fs.readFileSync(tempOut);
        return await this._convertToWebp(jpgBytes);
      }
      return Buffer.alloc(0);
    } finally {
      if (tempIn && fs.existsSync(tempIn)) try { fs.unlinkSync(tempIn); } catch (e) {}
      if (tempOut && fs.existsSync(tempOut)) try { fs.unlinkSync(tempOut); } catch (e) {}
    }
  }

  async uploadImage(filePathOrBytes, contentType = "image/webp") {
    let rawBytes;
    if (typeof filePathOrBytes === "string") {
      if (filePathOrBytes.startsWith("http://") || filePathOrBytes.startsWith("https://")) {
        const parsedUrl = new URL(filePathOrBytes);
        const domainOrigin = `${parsedUrl.protocol}//${parsedUrl.host}/`;
        let resp = await fetch(filePathOrBytes, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36", Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9", Referer: domainOrigin } });
        if (resp.status !== 200) resp = await fetch(filePathOrBytes);
        if (resp.status !== 200) throw new StorageUploadError(`Failed to download image from URL (${resp.status}): ${filePathOrBytes}`);
        rawBytes = Buffer.from(await resp.arrayBuffer());
      } else {
        rawBytes = fs.readFileSync(filePathOrBytes);
      }
    } else {
      rawBytes = Buffer.from(filePathOrBytes);
    }

    const webpBytes = await this._convertToWebp(rawBytes);
    const token = randomUUID();
    const filename = `${MomentsModule._randomId(20)}.webp`;
    const userUid = this.client.session.uid;
    const idToken = await this.client.session.getValidToken();
    const objectPath = `users/${userUid}/moments/thumbnails/${filename}`;
    const encodedName = encodeURIComponent(objectPath);
    const initUrl = `${MomentsModule.STORAGE_IMG_URL}/${encodedName}?uploadType=resumable&name=${encodedName}`;
    const metadata = {
      bucket: "",
      contentType,
      name: objectPath,
      metadata: { visibility: "private", creator: userUid },
      cacheControl: "public, max-age=604800"
    };
    const headers = {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Firebase ${idToken}`,
      "x-goog-upload-protocol": "resumable",
      "x-goog-upload-command": "start",
      "x-goog-upload-content-type": contentType,
      "x-goog-upload-content-length": String(webpBytes.length),
      "x-firebase-storage-version": "ios/12.12.1",
      "x-firebase-gmpid": this.client.session.constructor.FIREBASE_APP_ID,
      "User-Agent": `${this.client.device.userAgent} (GTMSUF/1)`
    };
    const initRes = await fetch(initUrl, { method: "POST", headers, body: JSON.stringify(metadata) });
    if (initRes.status !== 200) throw new StorageUploadError(`Image upload initialization failed (${initRes.status}): ${await initRes.text()}`);
    const uploadUrl = initRes.headers.get("x-goog-upload-url");
    if (!uploadUrl) throw new StorageUploadError("Missing upload URL from Firebase Storage");

    const uploadHeaders = {
      "Content-Type": "application/octet-stream",
      "x-goog-upload-protocol": "resumable",
      "x-goog-upload-command": "upload, finalize",
      "x-goog-upload-offset": "0",
      "x-goog-upload-content-length": String(webpBytes.length)
    };
    const uploadRes = await fetch(uploadUrl, { method: "PUT", headers: uploadHeaders, body: webpBytes });
    if (uploadRes.status !== 200) throw new StorageUploadError(`Image upload transfer failed (${uploadRes.status}): ${await uploadRes.text()}`);

    let downloadToken = token;
    try {
      const rj = await uploadRes.json();
      if (rj.downloadTokens) downloadToken = rj.downloadTokens.split(",")[0];
    } catch (e) {}
    return `${MomentsModule.STORAGE_IMG_URL}/${encodedName}?alt=media&token=${downloadToken}`;
  }

  async optimizeVideo(videoInput, options = {}) {
    const { targetSizeBytes = 5650000, maxDimension = 1080, preserveResolution = true, priority = "balanced", progressCallback = null } = options;

    let ffmpegBin = null;
    try { ffmpegBin = require("imageio-ffmpeg").getFfmpegExe(); } catch (e) {}
    if (!ffmpegBin) ffmpegBin = "ffmpeg";

    let tempIn = null;
    let inPath = videoInput;
    if (Buffer.isBuffer(videoInput) || videoInput instanceof Uint8Array) {
      tempIn = path.join(os.tmpdir(), `vin_${Date.now()}.mp4`);
      fs.writeFileSync(tempIn, Buffer.from(videoInput));
      inPath = tempIn;
    }

    try {
      const probe = spawnSync(ffmpegBin, ["-i", inPath], { encoding: "utf-8" });
      const errStr = (probe.stderr || "") + (probe.stdout || "");
      const m = errStr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      let duration = 10.0;
      if (m) {
        const h = parseFloat(m[1]); const mins = parseFloat(m[2]); const s = parseFloat(m[3]);
        duration = h * 3600 + mins * 60 + s;
        duration = Math.max(1.0, duration);
      }
      const hasAudio = errStr.includes("Audio:");

      const totalTargetBits = targetSizeBytes * 8;
      const totalBitrateKbps = (totalTargetBits / duration) / 1000;

      const normP = (priority || "balanced").toLowerCase();
      let audioKbps = 0;
      if (hasAudio) {
        if (["audio", "music", "tieng", "sound"].includes(normP)) {
          if (duration > 300) audioKbps = 64;
          else if (duration > 120) audioKbps = 96;
          else if (duration > 45) audioKbps = 128;
          else audioKbps = 160;
        } else if (["video", "resolution", "hinh_anh"].includes(normP)) {
          if (duration > 300) audioKbps = 24;
          else if (duration > 120) audioKbps = 32;
          else if (duration > 45) audioKbps = 48;
          else audioKbps = 64;
        } else {
          if (duration > 300) audioKbps = 32;
          else if (duration > 120) audioKbps = 64;
          else if (duration > 45) audioKbps = 96;
          else audioKbps = 128;
        }
      }

      let fpsTarget = null;
      let muxOverhead = 0.94;
      if (duration > 300) { fpsTarget = 24; muxOverhead = 0.88; }
      else if (duration > 120) { fpsTarget = 30; muxOverhead = 0.91; }
      const gopSize = (fpsTarget || 30) * 2;

      const netBitrateKbps = totalBitrateKbps * muxOverhead;
      let videoKbps = Math.round(netBitrateKbps - audioKbps);
      videoKbps = Math.max(35, Math.min(videoKbps, 4000));

      const tempOut = path.join(os.tmpdir(), `vout_${Date.now()}.mp4`);
      fs.closeSync(fs.openSync(tempOut, "w"));

      let useHevc = false;
      if (preserveResolution) {
        const chk = spawnSync(ffmpegBin, ["-encoders"], { encoding: "utf-8" });
        if ((chk.stdout || "").includes("libx265")) useHevc = true;
      }
      const encPreset = duration > 180 ? "veryfast" : "fast";

      let cmd = [ffmpegBin, "-y", "-i", inPath];
      if (useHevc) {
        const scaleFilter = "scale=trunc(iw/2)*2:trunc(ih/2)*2";
        cmd = cmd.concat(["-c:v", "libx265", "-tag:v", "hvc1", "-pix_fmt", "yuv420p", "-preset", encPreset, "-b:v", `${videoKbps}k`, "-maxrate", `${videoKbps}k`, "-bufsize", `${Math.round(videoKbps * 1.2)}k`, "-g", String(gopSize), "-keyint_min", String(Math.floor(gopSize / 2)), "-x265-params", "no-open-gop=1:repeat-headers=1", "-vf", scaleFilter, "-movflags", "+faststart"]);
        if (fpsTarget) cmd = cmd.concat(["-r", String(fpsTarget)]);
      } else {
        let scaleFilter;
        if (preserveResolution) scaleFilter = "scale=trunc(iw/2)*2:trunc(ih/2)*2";
        else {
          const scaleLimit = duration > 45 ? 720 : maxDimension;
          scaleFilter = `scale=w='min(${scaleLimit},iw)':h='min(${scaleLimit},ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`;
        }
        cmd = cmd.concat(["-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "fast", "-b:v", `${videoKbps}k`, "-maxrate", `${Math.round(videoKbps * 1.15)}k`, "-bufsize", `${Math.round(videoKbps * 1.8)}k`, "-g", String(gopSize), "-keyint_min", String(Math.floor(gopSize / 2)), "-vf", scaleFilter, "-movflags", "+faststart"]);
        if (fpsTarget) cmd = cmd.concat(["-r", String(fpsTarget)]);
      }
      if (hasAudio) cmd = cmd.concat(["-c:a", "aac", "-b:a", `${audioKbps}k`]);
      else cmd = cmd.concat(["-an"]);
      cmd = cmd.concat([tempOut]);

      const proc = spawn(cmd[0], cmd.slice(1), { stdio: ["ignore", "ignore", "pipe"] });
      let stderrBuf = "";
      const timePattern = /time=(\d+):(\d+):(\d+\.\d+)/;
      let lastPct = -1;
      proc.stderr.on("data", (chunk) => {
        stderrBuf += chunk.toString();
        const lines = stderrBuf.split(/\r?\n/);
        stderrBuf = lines.pop();
        for (const line of lines) {
          const match = timePattern.exec(line);
          if (match) {
            const curSec = parseFloat(match[1]) * 3600 + parseFloat(match[2]) * 60 + parseFloat(match[3]);
            const pct = Math.min(99, Math.floor((curSec / duration) * 100));
            if (pct !== lastPct) {
              lastPct = pct;
              if (progressCallback) try { progressCallback(pct, `Nén video HEVC (${pct}%)...`); } catch (e) {}
            }
          }
        }
      });
      await new Promise((resolve, reject) => {
        proc.on("close", (code) => {
          if (code !== 0) reject(new StorageUploadError("Video compression failed during encoding."));
          else resolve();
        });
        proc.on("error", reject);
      });
      if (progressCallback) try { progressCallback(100, "Nén video hoàn tất 100%!"); } catch (e) {}

      const outBytes = fs.readFileSync(tempOut);
      try { fs.unlinkSync(tempOut); } catch (e) {}
      return outBytes;
    } finally {
      if (tempIn && fs.existsSync(tempIn)) try { fs.unlinkSync(tempIn); } catch (e) {}
    }
  }

  async uploadVideo(videoPathOrBytes, options = {}) {
    const { contentType = "video/mp4", autoCompress = true, priority = "balanced", progressCallback = null } = options;
    let videoBytes;
    let videoInput;
    if (typeof videoPathOrBytes === "string") {
      if (videoPathOrBytes.startsWith("http://") || videoPathOrBytes.startsWith("https://")) {
        const parsedVurl = new URL(videoPathOrBytes);
        const vOrigin = `${parsedVurl.protocol}//${parsedVurl.host}/`;
        let resp = await fetch(videoPathOrBytes, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36", Accept: "*/*", Referer: vOrigin } });
        if (resp.status !== 200) resp = await fetch(videoPathOrBytes);
        if (resp.status !== 200) throw new StorageUploadError(`Failed to download video from URL (${resp.status}): ${videoPathOrBytes}`);
        videoBytes = Buffer.from(await resp.arrayBuffer());
        videoInput = videoBytes;
      } else {
        videoBytes = fs.readFileSync(videoPathOrBytes);
        videoInput = videoPathOrBytes;
      }
    } else {
      videoBytes = Buffer.from(videoPathOrBytes);
      videoInput = videoBytes;
    }

    if (videoBytes.length >= 6291456) {
      if (autoCompress) {
        videoBytes = await this.optimizeVideo(videoInput, { priority, progressCallback });
      } else {
        throw new StorageUploadError(`Video size (${videoBytes.length} bytes / ${(videoBytes.length / 1024 / 1024).toFixed(2)} MB) exceeds Locket's strict limit of 6 MB (6,291,455 bytes). Please compress before uploading.`);
      }
    }

    const token = randomUUID();
    const filename = `${MomentsModule._randomId(20)}.mp4`;
    const userUid = this.client.session.uid;
    const idToken = await this.client.session.getValidToken();
    const objectPath = `users/${userUid}/moments/videos/${filename}`;
    const encodedName = encodeURIComponent(objectPath);
    const initUrl = `${MomentsModule.STORAGE_VIDEO_URL}/${encodedName}?uploadType=resumable&name=${encodedName}`;
    const metadata = {
      bucket: "",
      contentType,
      name: objectPath,
      metadata: { visibility: "private", creator: userUid },
      cacheControl: "public, max-age=604800"
    };
    const headers = {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Firebase ${idToken}`,
      "x-goog-upload-protocol": "resumable",
      "x-goog-upload-command": "start",
      "x-goog-upload-content-type": contentType,
      "x-goog-upload-content-length": String(videoBytes.length),
      "x-firebase-storage-version": "ios/12.12.1",
      "x-firebase-gmpid": this.client.session.constructor.FIREBASE_APP_ID,
      "User-Agent": `${this.client.device.userAgent} (GTMSUF/1)`
    };
    const initRes = await fetch(initUrl, { method: "POST", headers, body: JSON.stringify(metadata) });
    if (initRes.status !== 200) throw new StorageUploadError(`Video upload initialization failed (${initRes.status}): ${await initRes.text()}`);
    const uploadUrl = initRes.headers.get("x-goog-upload-url");
    if (!uploadUrl) throw new StorageUploadError("Missing upload URL from Firebase Storage");

    const uploadHeaders = {
      "Content-Type": "application/octet-stream",
      "x-goog-upload-protocol": "resumable",
      "x-goog-upload-command": "upload, finalize",
      "x-goog-upload-offset": "0",
      "x-goog-upload-content-length": String(videoBytes.length)
    };
    const uploadRes = await fetch(uploadUrl, { method: "PUT", headers: uploadHeaders, body: videoBytes });
    if (uploadRes.status !== 200) throw new StorageUploadError(`Video data upload failed (${uploadRes.status}): ${await uploadRes.text()}`);

    let downloadToken = token;
    try {
      const rj = await uploadRes.json();
      if (rj.downloadTokens) downloadToken = rj.downloadTokens.split(",")[0];
    } catch (e) {}
    return `${MomentsModule.STORAGE_VIDEO_URL}/${encodedName}?alt=media&token=${downloadToken}`;
  }

  buildOverlay(options = {}) {
    const { text = "", noteType = NoteType.STANDARD, icon = null, colors = null, textColor = null } = options;
    let presetInfo = null;
    const presetFile = path.join(__dirname, "..", "..", "caption_presets.json");
    const cleanKey = noteType.replace("caption:", "");
    if (fs.existsSync(presetFile)) {
      try {
        const presets = JSON.parse(fs.readFileSync(presetFile, "utf-8"));
        presetInfo = presets[cleanKey] || null;
      } catch (e) {}
    }

    let finalText = text;
    let finalType = noteType;
    let finalColors = colors !== null ? colors : [];
    let finalTextColor = textColor || "#FFFFFFE6";
    let finalIcon = icon;

    if (presetInfo) {
      if (!finalText) finalText = presetInfo.text || "";
      finalType = presetInfo.type || "static_content";
      if (colors === null) finalColors = presetInfo.colors || [];
      if (!textColor && presetInfo.text_color) finalTextColor = presetInfo.text_color;
      if (!finalIcon && presetInfo.icon) finalIcon = presetInfo.icon;
    }

    let targetOverlayId;
    let dataType;
    if (noteType === NoteType.STANDARD) {
      targetOverlayId = "caption:standard";
      dataType = "standard";
    } else if (presetInfo && presetInfo.overlay_id) {
      targetOverlayId = presetInfo.overlay_id;
      dataType = presetInfo.type || "static_content";
    } else if (noteType.startsWith("caption:")) {
      targetOverlayId = noteType;
      dataType = finalType.includes("static_content") ? "static_content" : noteType.split(":").pop();
    } else {
      targetOverlayId = `caption:${noteType}`;
      dataType = noteType;
    }

    const maxLinesVal = (presetInfo || ["static_content", "streak", "time", "review"].includes(dataType)) ? "1" : "4";
    const overlayData = {
      text: finalText,
      type: dataType,
      text_color: finalTextColor,
      max_lines: { value: maxLinesVal, "@type": "type.googleapis.com/google.protobuf.Int64Value" },
      background: { material_blur: finalColors.length ? "regular" : "ultra_thin", colors: finalColors }
    };
    if (finalIcon) overlayData.icon = { data: finalIcon, type: "emoji" };

    return {
      overlay_type: "caption",
      overlay_id: targetOverlayId,
      alt_text: finalIcon ? `${finalIcon} ${finalText}` : finalText,
      data: overlayData
    };
  }

  async post(options = {}) {
    const {
      image = null,
      caption = "",
      video = null,
      noteType = NoteType.STANDARD,
      icon = null,
      colors = null,
      textColor = null,
      isPrivate = false,
      recipients = null,
      autoCompress = true,
      priority = "balanced",
      progressCallback = null
    } = options;

    let img = image;
    if (video && !image) {
      img = await this.extractThumbnail(video);
    }

    let thumbUrl = "";
    if (typeof img === "string" && (img.startsWith("http://") || img.startsWith("https://"))) {
      if (img.includes("firebasestorage.googleapis.com") && img.includes("alt=media")) {
        thumbUrl = img;
      } else {
        thumbUrl = await this.uploadImage(img);
      }
    } else if (img) {
      thumbUrl = await this.uploadImage(img);
    }

    let videoUrl = null;
    if (video) {
      if (typeof video === "string" && (video.startsWith("http://") || video.startsWith("https://"))) {
        if (video.includes("firebasestorage.googleapis.com") && video.includes("alt=media")) {
          videoUrl = video;
        } else {
          videoUrl = await this.uploadVideo(video, { autoCompress, priority, progressCallback });
        }
      } else {
        videoUrl = await this.uploadVideo(video, { autoCompress, priority, progressCallback });
      }
    }

    const overlays = [];
    let cap = caption;
    if (caption || noteType !== NoteType.STANDARD || colors || icon) {
      const ov = this.buildOverlay({ text: caption, noteType, icon, colors, textColor });
      overlays.push(ov);
      if (!caption) cap = ov.alt_text || "";
    }

    const payload = {
      thumbnail_url: thumbUrl,
      overlays,
      sent_to_self_only: isPrivate,
      sent_to_all: !isPrivate && !recipients,
      recipients: recipients || [],
      md5: `${randomUUID().replace(/-/g, "")}_${Math.floor(Date.now() / 1000)}`
    };
    if (cap && !overlays.length) payload.caption = cap;
    if (videoUrl) payload.video_url = videoUrl;

    const res = await this.client.postApi("postMomentV2", payload);
    if (res && (res.status !== undefined && res.status !== 200 && res.status !== null) || (res && res.errors)) {
      const errMsg = (res && (res.errors || res.error)) || `Locket API error ${res && res.status}`;
      throw new LocketAPIError(`Post moment failed: ${errMsg}`);
    }
    const dataRes = (res && res.data) ? res.data : res;
    if (dataRes && typeof dataRes === "object") {
      if (!dataRes.id && dataRes.canonical_uid) dataRes.id = dataRes.canonical_uid;
      const momentEntry = {
        moment_uid: dataRes.canonical_uid || dataRes.id,
        canonical_uid: dataRes.canonical_uid || dataRes.id,
        thumbnail_url: thumbUrl,
        video_url: videoUrl,
        caption: cap || "",
        created_at: new Date().toISOString()
      };
      this.recordPostedMoment(momentEntry);
    }
    return dataRes;
  }

  async getLatest() {
    const res = await this.client.postApi("getLatestMomentV2", { should_count_missed_moments: true });
    return (res && res.data) ? res.data : [];
  }

  async getSharedMomentsByUsername(username, limit = null) {
    const profile = await this.client.user.getProfileByUsername(username);
    const targetUid = profile ? profile.uid : null;
    if (!targetUid) return [];
    return this.getSharedMomentsByUser(targetUid, limit);
  }

  async getSharedMomentsByUser(userUid, limit = null) {
    const moments = [];
    const seenUids = new Set();
    let currentSync = null;
    try {
      const allFriends = await this.client.friends.getAllFriends();
      const friendUids = allFriends.map(f => f.uid).filter(Boolean);
      const otherFriends = friendUids.filter(fuid => fuid !== userUid);

      while (true) {
        const payload = {
          should_count_missed_moments: true,
          include_group_moments: true,
          excluded_users: otherFriends
        };
        if (currentSync) payload.sync_token = currentSync;
        const feedRes = await this.client.postApi("getLatestMomentV2", payload);
        const data = (feedRes && feedRes.data) ? feedRes.data : [];
        if (!data || !data.length) break;

        let newCount = 0;
        for (const m of data) {
          const mid = m.canonical_uid;
          if (mid && !seenUids.has(mid)) {
            seenUids.add(mid);
            newCount++;
            currentSync = mid;
            if (m.user === userUid) {
              let createdTs = "";
              const dateField = m.date;
              if (dateField && typeof dateField === "object" && dateField._seconds) createdTs = String(dateField._seconds);
              moments.push({
                moment_uid: mid,
                user_uid: userUid,
                thumbnail_url: m.thumbnail_url,
                image_url: m.image_url || m.thumbnail_url,
                video_url: m.video_url,
                caption: m.caption || "",
                overlays: m.overlays || [],
                created_at: createdTs,
                date: dateField,
                md5: m.md5,
                source: "feed"
              });
              if (limit && moments.length >= limit) return moments.slice(0, limit);
            }
          }
        }
        if (newCount === 0 || (feedRes && feedRes.status === 304)) break;
      }
    } catch (e) {}
    return moments;
  }

  async getFilters() {
    const res = await this.client.postApi("getFilters", {});
    return (res && res.data) ? res.data : res;
  }

  async markAsViewed(momentUid) {
    return this.client.postApi("markMomentAsViewed", { moment_uid: momentUid });
  }

  async react(momentUid, reaction = "❤️", fromMemory = false) {
    const payload = {
      moment_uid: momentUid,
      reaction,
      from_memory: fromMemory,
      intensity: { "@type": "type.googleapis.com/google.protobuf.Int64Value", value: "0" }
    };
    return this.client.postApi("reactToMoment", payload);
  }

  async getRollcallPosts(weekOfYear = null, year = null, source = "banner") {
    const now = new Date();
    const iso = this._isoWeek(now);
    if (weekOfYear === null) weekOfYear = iso.week;
    if (year === null) year = iso.year;
    const payload = {
      week_of_year: { "@type": "type.googleapis.com/google.protobuf.Int64Value", value: String(weekOfYear) },
      year: { "@type": "type.googleapis.com/google.protobuf.Int64Value", value: String(year) },
      source
    };
    const res = await this.client.postApi("getRollcallPosts", payload);
    return (res && res.data) ? res.data : res;
  }

  _isoWeek(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return { year: date.getUTCFullYear(), week };
  }

  async getAllMyMoments(options = {}) {
    const { limit = null, startDate = null, endDate = null } = options;
    const parseTs = (tsStr) => {
      if (!tsStr) return null;
      try {
        let s = String(tsStr).replace("Z", "+00:00");
        if (s.length === 10) s += "T00:00:00+00:00";
        return new Date(s);
      } catch (e) { return null; }
    };
    let dtStart = parseTs(startDate);
    let dtEnd = parseTs(endDate);
    if (dtEnd && String(endDate).trim().length === 10) {
      dtEnd = new Date(dtEnd); dtEnd.setHours(23, 59, 59, 999);
    }

    const token = await this.client.session.getValidToken();
    const myUid = this.client.session.uid;
    const moments = [];
    const seenMids = new Set();

    const postedHistory = this._loadHistory();
    for (const p of postedHistory) {
      const mid = p.moment_uid || p.canonical_uid || p.id;
      if (!mid || seenMids.has(mid)) continue;
      const createdRaw = p.created_at || "";
      if (dtStart || dtEnd) {
        const docDt = parseTs(createdRaw);
        if (docDt) {
          if (dtStart && docDt < dtStart) continue;
          if (dtEnd && docDt > dtEnd) continue;
        }
      }
      seenMids.add(mid);
      const viewsData = await this.getViews(mid);
      moments.push({
        moment_uid: mid,
        thumbnail_url: p.thumbnail_url,
        video_url: p.video_url,
        caption: p.caption || "",
        views_count: (viewsData && viewsData.count) || 0,
        viewers: (viewsData && viewsData.moment_views) || [],
        reactions: (viewsData && viewsData.reactions) || [],
        created_at: createdRaw,
        source: "posted_moment"
      });
      if (limit && moments.length >= limit) return moments.slice(0, limit);
    }

    try {
      const uUrl = `https://firestore.googleapis.com/v1/projects/locket-4252a/databases/(default)/documents/users/${myUid}/conversations`;
      const uRes = await fetch(uUrl, { headers: { Authorization: `Bearer ${token}` } });
      const uData = await uRes.json();
      const userStoragePath = `users%2F${myUid}%2Fmoments`;
      for (const doc of (uData.documents || [])) {
        const cid = doc.name.split("/").pop();
        const mUrl = `https://firestore.googleapis.com/v1/projects/locket-4252a/databases/(default)/documents/conversations/${cid}/messages?pageSize=200`;
        const mRes = await fetch(mUrl, { headers: { Authorization: `Bearer ${token}` } });
        const mData = await mRes.json();
        for (const mdoc of (mData.documents || [])) {
          const f = mdoc.fields || {};
          const thumb = (f.thumbnail_url && f.thumbnail_url.stringValue) || "";
          const rm = (f.reply_moment && f.reply_moment.stringValue) || null;
          const createdRaw = (f.created_at && f.created_at.timestampValue) || "";
          if (thumb && thumb.includes(userStoragePath.replace(/%2F/g, "/"))) {
            const mid = rm || mdoc.name.split("/").pop();
            if (!mid || seenMids.has(mid)) continue;
            if (dtStart || dtEnd) {
              const docDt = parseTs(createdRaw);
              if (docDt) {
                if (dtStart && docDt < dtStart) continue;
                if (dtEnd && docDt > dtEnd) continue;
              }
            }
            const viewsData = await this.getViews(mid);
            if (viewsData && (viewsData.status === 200 || viewsData.status === null || viewsData.count !== undefined)) {
              seenMids.add(mid);
              moments.push({
                moment_uid: mid,
                thumbnail_url: thumb,
                video_url: null,
                caption: "",
                views_count: (viewsData && viewsData.count) || 0,
                viewers: (viewsData && viewsData.moment_views) || [],
                reactions: (viewsData && viewsData.reactions) || [],
                created_at: createdRaw,
                source: "posted_moment"
              });
              if (limit && moments.length >= limit) return moments.slice(0, limit);
            }
          }
        }
      }
    } catch (e) {}
    return moments;
  }

  async getViews(momentUid) {
    const payload = { moment_uid: momentUid };
    const res = await this.client.postApi("getMomentViews", payload);
    const viewsDict = (res && typeof res === "object") ? (res.data || res) : {};
    const reactions = [];
    try {
      const token = await this.client.session.getValidToken();
      const url = `https://firestore.googleapis.com/v1/projects/locket-4252a/databases/(default)/documents/moments/${momentUid}/reactions`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      for (const doc of (data.documents || [])) {
        const f = doc.fields || {};
        reactions.push({
          emoji: (f.string && f.string.stringValue) || "",
          sender: (f.user && f.user.stringValue) || "",
          created_at: (f.created_at && f.created_at.timestampValue) || ""
        });
      }
    } catch (e) {}
    if (viewsDict && typeof viewsDict === "object") viewsDict.reactions = reactions;
    return viewsDict;
  }

  async comment(momentUid, receiverUid, text, fromMemory = false) {
    const payload = {
      moment_uid: momentUid,
      receiver_uid: receiverUid,
      msg: text,
      from_memory: fromMemory,
      client_token: null
    };
    const res = await this.client.postApi("sendChatMessageV2", payload);
    return (res && res.data) ? res.data : res;
  }

  async delete(momentUid) {
    return this.client.postApi("deleteMomentV2", { moment_uid: momentUid, canonical_uid: momentUid });
  }
}

module.exports = { MomentsModule, NoteType };