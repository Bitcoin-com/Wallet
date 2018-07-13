//---------------------------------------------------------------------
//
// Add components what are missing in old JavaScript Engine
//
//---------------------------------------------------------------------

if (!ArrayBuffer['isView']) {
    ArrayBuffer.isView = function(a) {
        return a !== null && typeof(a) === "object" && a['buffer'] instanceof ArrayBuffer;
    };
}