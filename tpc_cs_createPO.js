/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
 define(['N/currentRecord', 'N/https'], function (currentRecord, https) {
    
    function pageInit(context) {
        try {
            var record = currentRecord.get();

            // Get URL Parameters
            var urlParams = new URLSearchParams(window.location.search);
            var customerId = urlParams.get('custpage_customer');
            var soId = urlParams.get('custpage_so_id');
            // var phase = urlParams.get('custpage_so_phase');
            // var room = urlParams.get('custpage_so_room');
            // var system = urlParams.get('custpage_so_system');

            // Set field values if parameters exist
            if (customerId) record.setValue({ fieldId: 'custpage_customer', value: customerId });
            if (soId) record.setValue({ fieldId: 'custpage_so_id', value: soId });
            // if (phase) record.setValue({ fieldId: 'custpage_so_phase', value: phase });
            // if (room) record.setValue({ fieldId: 'custpage_so_room', value: room });
            // if (system) record.setValue({ fieldId: 'custpage_so_system', value: system });
        } catch (error) {
            console.error('Error in pageInit:', error);
        }
    }

    function reloadWithFilters() {
        try {
            var record = currentRecord.get();
            var customerId = record.getValue({ fieldId: 'custpage_customer' });
            var soId = record.getValue({ fieldId: 'custpage_so_id' });
            // var phase = record.getValue({ fieldId: 'custpage_so_phase' });
            // var room = record.getValue({ fieldId: 'custpage_so_room' });
            // var system = record.getValue({ fieldId: 'custpage_so_system' });

            if (!customerId) {
                alert('Please select a Customer then select a Sales Order ID before loading the Sales Order.');
                return;
            }

            var baseUrl = window.location.href.split('&deploy=1', 1)[0]; // Remove existing params
            window.onbeforeunload = null;
            window.location.href = baseUrl + '&deploy=1&custpage_customer=' + customerId + '&custpage_so_id=' + soId;
                // + '&custpage_so_phase=' + encodeURIComponent(phase || '')
                // + '&custpage_so_room=' + encodeURIComponent(room || '')
                // + '&custpage_so_system=' + encodeURIComponent(system || '');
        } catch (error) {
            console.error('Error in reloadWithFilters:', error);
        }
    }

    function submitForm() {
        try {
            var record = currentRecord.get();
            var soId = record.getValue({ fieldId: 'custpage_so_id' });

            var selectedLines = [];
            var sublistLineCount = record.getLineCount({ sublistId: 'custpage_sublist' });

            for (var i = 0; i < sublistLineCount; i++) {
                var isSelected = record.getSublistValue({
                    sublistId: 'custpage_sublist',
                    fieldId: 'custpage_select',
                    line: i
                });

                if (isSelected === 'T') {
                    var lineKey = record.getSublistValue({
                        sublistId: 'custpage_sublist',
                        fieldId: 'custpage_key',
                        line: i
                    });
                    selectedLines.push(lineKey);
                }
            }

            if (selectedLines.length === 0) {
                alert('Please select at least one item before submitting.');
                return false;
            }

            // Send data to Suitelet
            var response = https.post({
                url: window.location.href,
                body: JSON.stringify({ soId: soId, selectedLines: selectedLines }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.code === 200) {
                alert('Sales Order updated successfully!');
                window.onbeforeunload = null;
                location.reload();
            } else {
                alert('Error updating Sales Order: ' + response.body);
            }

            return false;
        } catch (error) {
            console.error('Error in submitForm:', error);
            alert('An unexpected error occurred.');
            return false;
        }
    }

    return {
        pageInit: pageInit,
        reloadWithFilters: reloadWithFilters,
        submitForm: submitForm
    };
});
