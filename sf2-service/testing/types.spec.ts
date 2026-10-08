import { expect } from "chai";
import SF2Service from "../index.js";

// Type inference tests - these should compile without errors
// The main goal is to verify TypeScript can properly infer types from the module
describe("TypeScript Module Import", () => {
  it("should successfully import SF2Service as default export", () => {
    expect(SF2Service).to.exist;
    expect(typeof SF2Service).to.equal("function");
  });

  it("should create an instance of SF2Service with correct type inference", () => {
    const url = "https://example.com/test.sf2";
    const sf2 = new SF2Service(url);
    
    // These type checks happen at compile time
    expect(sf2).to.be.instanceof(SF2Service);
    expect(sf2.url).to.equal(url);
  });

  it("should have all expected methods on SF2Service instance", () => {
    const sf2 = new SF2Service("https://example.com/test.sf2");
    
    expect(typeof sf2.load).to.equal("function");
    expect(typeof sf2.loadProgram).to.equal("function");
  });

  it("should have correct property getters", () => {
    const sf2 = new SF2Service("https://example.com/test.sf2");
    
    // These will be undefined until load() is called, but the types should be correct
    // The test here is that TypeScript compiles without errors
    expect(sf2).to.respondTo("meta");
    expect(sf2).to.respondTo("programNames");
    expect(sf2).to.respondTo("presets");
  });
});
