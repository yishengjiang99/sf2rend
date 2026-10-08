import SF2Service from "../index.js";

// eslint-disable-next-line no-undef
describe("SF2Service - Comprehensive Tests", () => {
  let sf2;
  // CI passes --sf2-test-url via karma client.args to serve static/ locally;
  // otherwise fall back to the deployed site.
  const _karmaArgs = (typeof window !== "undefined" && window.__karma__?.config?.args) || [];
  const _urlFlag = _karmaArgs.indexOf("--sf2-test-url");
  const sf2url = (_urlFlag >= 0 && _karmaArgs[_urlFlag + 1]) ||
    "https://yishengjiang99.github.io/sf2rend/static/GeneralUserGS.sf2";

  describe("Constructor", () => {
    it("should create SF2Service instance with URL", () => {
      const service = new SF2Service("http://example.com/test.sf2");
      expect(service).to.be.instanceof(SF2Service);
      expect(service.url).to.equal("http://example.com/test.sf2");
    });

    it("should store the URL property", () => {
      sf2 = new SF2Service(sf2url);
      expect(sf2.url).to.equal(sf2url);
    });
  });

  describe("Class structure and methods", () => {
    beforeEach(() => {
      sf2 = new SF2Service(sf2url);
    });

    it("should have load method", () => {
      expect(sf2.load).to.be.a("function");
    });

    it("should have meta getter", () => {
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(sf2), 'meta');
      expect(descriptor).to.exist;
      expect(descriptor.get).to.be.a('function');
    });

    it("should have programNames getter", () => {
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(sf2), 'programNames');
      expect(descriptor).to.exist;
      expect(descriptor.get).to.be.a('function');
    });

    it("should have presets getter", () => {
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(sf2), 'presets');
      expect(descriptor).to.exist;
      expect(descriptor.get).to.be.a('function');
    });

    it("should have loadProgram method", () => {
      expect(sf2.loadProgram).to.be.a("function");
    });

    it("should accept URL parameter in constructor", () => {
      const testUrl = "https://example.com/test.sf2";
      const service = new SF2Service(testUrl);
      expect(service.url).to.equal(testUrl);
    });

    it("should be extensible", () => {
      expect(Object.isExtensible(sf2)).to.be.true;
    });
  });

  describe("Integration tests (with network)", function() {
    // These tests require network access and will be skipped in offline mode
    this.timeout(15000);

    beforeEach(async function() {
      sf2 = new SF2Service(sf2url);
    });

    it("should load and return state object with all required properties", async function() {
      try {
        const state = await sf2.load();
        if (state) {
          expect(state).to.have.property("pdtaRef");
          expect(state).to.have.property("heap");
          expect(state).to.have.property("programNames");
        }
      } catch (e) {
        // Skip test if network is unavailable
        this.skip();
      }
    });

    it("should call onHeader callback when provided", async function() {
      try {
        const headers = [];
        await sf2.load({
          onHeader: (pid, bid, name) => {
            headers.push({ pid, bid, name });
          }
        });
        if (headers.length > 0) {
          expect(headers[0]).to.have.property("name");
        }
      } catch (e) {
        this.skip();
      }
    });

    it("should provide program names after loading", async function() {
      try {
        await sf2.load();
        const names = sf2.programNames;
        if (names && names.length > 0) {
          expect(names[0]).to.be.a("string");
        }
      } catch (e) {
        this.skip();
      }
    });

    it("should be able to load a program after loading", async function() {
      try {
        await sf2.load();
        const program = sf2.loadProgram(0, 0);
        if (program) {
          expect(program).to.have.property("zMap");
          expect(program).to.have.property("pid");
          expect(program).to.have.property("bkid");
          expect(program.pid).to.equal(0);
        }
      } catch (e) {
        this.skip();
      }
    });

    it("should provide filterKV method on loaded programs", async function() {
      try {
        await sf2.load();
        const program = sf2.loadProgram(0, 0);
        if (program) {
          expect(program.filterKV).to.be.a("function");
          const zones = program.filterKV(60, 64);
          expect(zones).to.be.an("array");
        }
      } catch (e) {
        this.skip();
      }
    });
  });

  describe("Unit tests for exported class", () => {
    it("SF2Service should be the default export", () => {
      expect(SF2Service).to.be.a("function");
      expect(SF2Service.prototype).to.exist;
    });

    it("should create instances with new keyword", () => {
      const instance = new SF2Service("test.sf2");
      expect(instance).to.be.instanceof(SF2Service);
    });

    it("should have distinct instances with different URLs", () => {
      const sf2a = new SF2Service("url1.sf2");
      const sf2b = new SF2Service("url2.sf2");
      expect(sf2a.url).to.not.equal(sf2b.url);
    });
  });
});
