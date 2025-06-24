/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define([], function () {
    function pageInit(context) {}

    function openSuitelet(suiteletURL) {
        // Redirect to the Suitelet
        window.location.href = suiteletURL;
    }

    return {
        pageInit: pageInit,
        openSuitelet: openSuitelet
    };
});
