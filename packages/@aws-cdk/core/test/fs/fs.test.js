"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const os = require("os");
const path = require("path");
const sinon = require("sinon");
const fs_1 = require("../../lib/fs");
describe('fs', () => {
    afterEach(() => {
        sinon.restore();
    });
    test('tmpdir returns a real path and is cached', () => {
        // Create symlink that points to /tmp
        const symlinkTmp = path.join(__dirname, 'tmp-link');
        fs.symlinkSync(os.tmpdir(), symlinkTmp);
        // Now stub os.tmpdir() to return this link instead of /tmp
        const tmpdirStub = sinon.stub(os, 'tmpdir').returns(symlinkTmp);
        expect(path.isAbsolute(fs_1.FileSystem.tmpdir)).toEqual(true);
        const p = path.join(fs_1.FileSystem.tmpdir, 'tmpdir-test.txt');
        fs.writeFileSync(p, 'tmpdir-test');
        expect(p).toEqual(fs.realpathSync(p));
        expect(fs.readFileSync(p, 'utf8')).toEqual('tmpdir-test');
        // check that tmpdir() is called either 0 times (in which case it was
        // proabably cached from before) or once (for this test).
        expect(tmpdirStub.callCount).toBeLessThan(2);
        fs.unlinkSync(p);
        fs.unlinkSync(symlinkTmp);
    });
    test('mkdtemp creates a temporary directory in the system temp', () => {
        const tmpdir = fs_1.FileSystem.mkdtemp('cdk-mkdtemp-');
        expect(path.dirname(tmpdir)).toEqual(fs_1.FileSystem.tmpdir);
        expect(fs.existsSync(tmpdir)).toEqual(true);
        fs.rmdirSync(tmpdir);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5QkFBeUI7QUFDekIseUJBQXlCO0FBQ3pCLDZCQUE2QjtBQUM3QiwrQkFBK0I7QUFDL0IscUNBQTBDO0FBRTFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO0lBQ2xCLFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDYixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7SUFFbEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsMENBQTBDLEVBQUUsR0FBRyxFQUFFO1FBQ3BELHFDQUFxQztRQUNyQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNwRCxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUV4QywyREFBMkQ7UUFDM0QsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRWhFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV6RCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQVUsQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUMxRCxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUVuQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFMUQscUVBQXFFO1FBQ3JFLHlEQUF5RDtRQUN6RCxNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU3QyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pCLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7SUFHNUIsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsMERBQTBELEVBQUUsR0FBRyxFQUFFO1FBQ3BFLE1BQU0sTUFBTSxHQUFHLGVBQVUsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7UUFFbEQsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsZUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hELE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTVDLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFHdkIsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIG9zIGZyb20gJ29zJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBzaW5vbiBmcm9tICdzaW5vbic7XG5pbXBvcnQgeyBGaWxlU3lzdGVtIH0gZnJvbSAnLi4vLi4vbGliL2ZzJztcblxuZGVzY3JpYmUoJ2ZzJywgKCkgPT4ge1xuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIHNpbm9uLnJlc3RvcmUoKTtcblxuICB9KTtcblxuICB0ZXN0KCd0bXBkaXIgcmV0dXJucyBhIHJlYWwgcGF0aCBhbmQgaXMgY2FjaGVkJywgKCkgPT4ge1xuICAgIC8vIENyZWF0ZSBzeW1saW5rIHRoYXQgcG9pbnRzIHRvIC90bXBcbiAgICBjb25zdCBzeW1saW5rVG1wID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ3RtcC1saW5rJyk7XG4gICAgZnMuc3ltbGlua1N5bmMob3MudG1wZGlyKCksIHN5bWxpbmtUbXApO1xuXG4gICAgLy8gTm93IHN0dWIgb3MudG1wZGlyKCkgdG8gcmV0dXJuIHRoaXMgbGluayBpbnN0ZWFkIG9mIC90bXBcbiAgICBjb25zdCB0bXBkaXJTdHViID0gc2lub24uc3R1YihvcywgJ3RtcGRpcicpLnJldHVybnMoc3ltbGlua1RtcCk7XG5cbiAgICBleHBlY3QocGF0aC5pc0Fic29sdXRlKEZpbGVTeXN0ZW0udG1wZGlyKSkudG9FcXVhbCh0cnVlKTtcblxuICAgIGNvbnN0IHAgPSBwYXRoLmpvaW4oRmlsZVN5c3RlbS50bXBkaXIsICd0bXBkaXItdGVzdC50eHQnKTtcbiAgICBmcy53cml0ZUZpbGVTeW5jKHAsICd0bXBkaXItdGVzdCcpO1xuXG4gICAgZXhwZWN0KHApLnRvRXF1YWwoZnMucmVhbHBhdGhTeW5jKHApKTtcbiAgICBleHBlY3QoZnMucmVhZEZpbGVTeW5jKHAsICd1dGY4JykpLnRvRXF1YWwoJ3RtcGRpci10ZXN0Jyk7XG5cbiAgICAvLyBjaGVjayB0aGF0IHRtcGRpcigpIGlzIGNhbGxlZCBlaXRoZXIgMCB0aW1lcyAoaW4gd2hpY2ggY2FzZSBpdCB3YXNcbiAgICAvLyBwcm9hYmFibHkgY2FjaGVkIGZyb20gYmVmb3JlKSBvciBvbmNlIChmb3IgdGhpcyB0ZXN0KS5cbiAgICBleHBlY3QodG1wZGlyU3R1Yi5jYWxsQ291bnQpLnRvQmVMZXNzVGhhbigyKTtcblxuICAgIGZzLnVubGlua1N5bmMocCk7XG4gICAgZnMudW5saW5rU3luYyhzeW1saW5rVG1wKTtcblxuXG4gIH0pO1xuXG4gIHRlc3QoJ21rZHRlbXAgY3JlYXRlcyBhIHRlbXBvcmFyeSBkaXJlY3RvcnkgaW4gdGhlIHN5c3RlbSB0ZW1wJywgKCkgPT4ge1xuICAgIGNvbnN0IHRtcGRpciA9IEZpbGVTeXN0ZW0ubWtkdGVtcCgnY2RrLW1rZHRlbXAtJyk7XG5cbiAgICBleHBlY3QocGF0aC5kaXJuYW1lKHRtcGRpcikpLnRvRXF1YWwoRmlsZVN5c3RlbS50bXBkaXIpO1xuICAgIGV4cGVjdChmcy5leGlzdHNTeW5jKHRtcGRpcikpLnRvRXF1YWwodHJ1ZSk7XG5cbiAgICBmcy5ybWRpclN5bmModG1wZGlyKTtcblxuXG4gIH0pO1xufSk7XG4iXX0=