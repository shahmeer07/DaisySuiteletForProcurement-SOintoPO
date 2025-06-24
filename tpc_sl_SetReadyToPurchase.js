/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
 define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/log', 'N/url'], function (serverWidget, search, record, log, url) {
    function onRequest(context) {
        try {
            if (context.request.method === 'GET') {
                var form = serverWidget.createForm({
                    title: 'Mark SO Lines Ready for Procurement'
                });

                form.clientScriptModulePath = '../ClientScript/tpc_cs_SetReadyToPurchase.js';

                // Add customer and sales order fields
                var customerField = form.addField({
                    id: 'custpage_customer',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Customer',
                    source: 'customer'
                });

                var SOIDField = form.addField({
                    id: 'custpage_so_id',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Sales Order ID',
                });

                // Create SELECT fields for Phase, Room, and System (Filter Fields)
                var phaseField = form.addField({
                    id: 'custpage_so_phase',
                    type: serverWidget.FieldType.MULTISELECT,
                    label: 'Phase'
                });

                var roomField = form.addField({
                    id: 'custpage_so_room',
                    type: serverWidget.FieldType.MULTISELECT,
                    label: 'Room'
                });

                var systemField = form.addField({
                    id: 'custpage_so_system',
                    type: serverWidget.FieldType.MULTISELECT,
                    label: 'System'
                });

                //Adding Activity code Filter here:
                var activitycodeField = form.addField({
                    id: "custpage_so_activitycode",
                    type: serverWidget.FieldType.SELECT,
                    label: "Activity Code"
                })
                

                // Add default options to filters
                phaseField.addSelectOption({ value: '', text: 'Select Phase' });
                roomField.addSelectOption({ value: '', text: 'Select Room' });
                systemField.addSelectOption({ value: '', text: 'Select System' });
                SOIDField.addSelectOption({ value: '', text: 'Select Sales Order' });
                //Adding defaul options to adtivity code below:
                activitycodeField.addSelectOption({ value: "" , text: "Select Activity Code"})

                // Pre-fill fields with existing filter values (so they retain values after refresh)
                var selectedPhase = context.request.parameters.custpage_so_phase || '';
                var selectedRoom = context.request.parameters.custpage_so_room || '';
                var selectedSystem = context.request.parameters.custpage_so_system || '';
                var selectedSOID = context.request.parameters.custpage_so_id || '';
                var selectedCustomer = context.request.parameters.custpage_customer || '';
                //Adding activity code field:
                var selectedActivityCode = context.request.parameters.custpage_so_activitycode || ''

                // If a customer is selected but no SO is provided, fetch all SOs for that customer
                if (selectedCustomer) {
                    var soSearch = search.create({
                        type: 'salesorder',
                        filters: [['entity', 'anyof', selectedCustomer], 'AND', ['mainline', 'is', 'T'], 'AND', ['custbody_tpc_sales_order_type', 'noneof', '4', '1']],
                        columns: [
                            search.createColumn({ name: 'internalid' }),
                            search.createColumn({ name: 'tranid' })
                        ]
                    });

                    var soResults = soSearch.run().getRange({ start: 0, end: 100 });

                    for (var i = 0; i < soResults.length; i++) {
                        SOIDField.addSelectOption({
                            value: soResults[i].getValue('tranid'),
                            text: soResults[i].getValue('tranid')
                        });
                    }
                }

                phaseField.defaultValue = selectedPhase;
                roomField.defaultValue = selectedRoom;
                systemField.defaultValue = selectedSystem;
                SOIDField.defaultValue = selectedSOID;
                activitycodeField.defaultValue = selectedActivityCode

                // Sublist for Sales Order Lines
                var sublist = form.addSublist({
                    id: 'custpage_sublist',
                    type: serverWidget.SublistType.LIST,
                    label: 'Sales Order Lines'
                });

                sublist.addMarkAllButtons();
                sublist.addField({ id: 'custpage_select', type: serverWidget.FieldType.CHECKBOX, label: 'RFP' });
                sublist.addField({ id: 'custpage_item', type: serverWidget.FieldType.TEXT, label: 'Item' });
                sublist.addField({ id: 'custpage_item_desc', type: serverWidget.FieldType.TEXT, label: 'Item Description' });
                sublist.addField({ id: 'custpage_quantity', type: serverWidget.FieldType.FLOAT, label: 'Quantity' });
                //hiding rate column
                sublist.addField({ id: 'custpage_est_rate', type: serverWidget.FieldType.CURRENCY, label: 'Est Cost' });
                sublist.addField({ id: 'custpage_est', type: serverWidget.FieldType.CURRENCY, label: 'Extended Cost' });
                 //hiding rate column
                // sublist.addField({ id: 'custpage_rate', type: serverWidget.FieldType.CURRENCY, label: 'Rate' });
                sublist.addField({ id: 'custpage_phase', type: serverWidget.FieldType.TEXT, label: 'Phase' });
                sublist.addField({ id: 'custpage_room', type: serverWidget.FieldType.TEXT, label: 'Room' });
                sublist.addField({ id: 'custpage_system', type: serverWidget.FieldType.TEXT, label: 'System' });
                sublist.addField({ id: 'custpage_vendor', type: serverWidget.FieldType.TEXT, label: 'PFD Vendor' });
                sublist.addField({ id: 'custpage_key', type: serverWidget.FieldType.TEXT, label: 'Unique Key' });
                sublist.addField({ id: 'custpage_int_id', type: serverWidget.FieldType.TEXT, label: 'Internal ID' });

                if (context.request.parameters.custpage_customer) {
                    const searchFilters = [
                        ['tranid', 'is', context.request.parameters.custpage_so_id],
                        'AND',
                        ['entity', 'anyof', context.request.parameters.custpage_customer],
                        'AND',
                        ['mainline', 'is', 'F'],
                        'AND',
                        ['taxline', 'is', 'F'],
                        'AND',
                        ['custcol_tpc_rfp', 'is', 'F'],
                        'AND',
                        ["custcol_tpc_linked_po",'anyof','@NONE@'],
                        'AND',
                        ['item.type', 'noneof', 'OtherCharge'],
                        'AND',
                        ['item.subtype', 'noneof', 'Sale']
                    ];

                    // Apply filter conditions if user has selected a filter
                    if (selectedPhase) {
                        searchFilters.push('AND', ['custcol_tpc_phase', 'is', selectedPhase]);
                    }
                    if (selectedRoom) {
                        searchFilters.push('AND', ['custcol_tpc_room', 'is', selectedRoom]);
                    }
                    if (selectedSystem) {
                        searchFilters.push('AND', ['custcol_tpc_system', 'is', selectedSystem]);
                    }
                    // Not sure about this but lets see
                    if(selectedActivityCode) { 
                        searchFilters.push('AND',['item.cseg_paactivitycode', 'is',selectedActivityCode])
                    }

                    const transactionSearchColItemSalesDescription = search.createColumn({ name: 'salesdescription', join: 'item' });
                    const transactionSearchColItemPreferredVendor = search.createColumn({ name: 'vendor', join: 'item' });
                    const searchColumns = [
                        search.createColumn({ name: 'internalid' }),
                        search.createColumn({ name: 'item' }),
                        transactionSearchColItemSalesDescription,
                        search.createColumn({ name: 'quantity' }),
                        // search.createColumn({ name: 'rate' }),
                        search.createColumn({ name: 'lineuniquekey' }),
                        search.createColumn({ name: 'custcol_tpc_phase' }),
                        search.createColumn({ name: 'custcol_tpc_room' }),
                        search.createColumn({ name: 'custcol_tpc_system' }),
                        search.createColumn({ name: 'costestimaterate' }),
                        search.createColumn({ name: 'costestimate' }),
                        search.createColumn({ name: 'custcol_tpc_rfp' }),
                        //added AC
                        search.createColumn({ name: 'cseg_paactivitycode' , join: "item"}),
                        
                        transactionSearchColItemPreferredVendor
                    ];

                    var salesOrderSearch = search.create({
                        type: 'salesorder',
                        filters: searchFilters,
                        columns: searchColumns
                    });
                    log.debug('Applied Search Filters', JSON.stringify(searchFilters));
                    var resultSet = salesOrderSearch.run().getRange({ start: 0, end: 999 });
                    log.debug("Sales Order Lines Result: ",resultSet)
                    
                    var uniquePhases = new Set();
                    var uniqueRooms = new Set();
                    var uniqueSystems = new Set();
                    // added ac
                    var uniqueActivityCodes = new Set();
                    for (var i = 0; i < resultSet.length; i++) {
                        var phaseValue = resultSet[i].getValue('custcol_tpc_phase');
                        var roomValue = resultSet[i].getValue('custcol_tpc_room');
                        var systemValue = resultSet[i].getValue('custcol_tpc_system');
                        // Getting activity code's value below
                        // var activityCode = resultSet[i].getText('cseg_paactivitycode');
                        var activityCode = resultSet[i].getText({
                            name: 'cseg_paactivitycode',
                            join: 'item'
                        });
                        var activityCode_text = resultSet[i].getText({
                            name: 'cseg_paactivitycode',
                            join: 'item'
                        });
                        var activityCode_value = resultSet[i].getValue({
                            name: 'cseg_paactivitycode',
                            join: 'item'
                        });

                        var vendor = resultSet[i].getText(transactionSearchColItemPreferredVendor);


                        if (phaseValue) uniquePhases.add(phaseValue);
                        if (roomValue) uniqueRooms.add(roomValue);
                        if (systemValue) uniqueSystems.add(systemValue);

                        //added activity code below
                        // if (activityCode) uniqueActivityCodes.add(activityCode);

                        if (activityCode_value && activityCode_text) {
                            uniqueActivityCodes[activityCode_value] = activityCode_text;
}
                        

                        sublist.setSublistValue({
                            id: 'custpage_int_id',
                            line: i,
                            value: resultSet[i].getValue('internalId')
                        });
                        sublist.setSublistValue({
                            id: 'custpage_key',
                            line: i,
                            value: resultSet[i].getValue('lineuniquekey')
                        });
                        sublist.setSublistValue({
                            id: 'custpage_select',
                            line: i,
                            value: resultSet[i].getValue('custcol_tpc_rfp') == true ? 'T' : 'F'
                        });
                        sublist.setSublistValue({
                            id: 'custpage_item',
                            line: i,
                            value: resultSet[i].getText('item')
                        });
                        sublist.setSublistValue({
                            id: 'custpage_item_desc',
                            line: i,
                            value: resultSet[i].getValue(transactionSearchColItemSalesDescription) || null
                        });
                        sublist.setSublistValue({
                            id: 'custpage_quantity',
                            line: i,
                            value: resultSet[i].getValue('quantity')
                        });
                        sublist.setSublistValue({
                            id: 'custpage_est_rate',
                            line: i,
                            value: resultSet[i].getValue('costestimaterate') || null
                        });
                        sublist.setSublistValue({
                            id: 'custpage_est',
                            line: i,
                            value: resultSet[i].getValue('costestimate') || null
                        });
                        // sublist.setSublistValue({
                        //     id: 'custpage_rate',
                        //     line: i,
                        //     value: resultSet[i].getValue('rate')
                        // });
                        sublist.setSublistValue({
                            id: 'custpage_phase',
                            line: i,
                            value: phaseValue || null
                        });
                        sublist.setSublistValue({
                            id: 'custpage_room',
                            line: i,
                            value: roomValue || null
                        });
                        sublist.setSublistValue({
                            id: 'custpage_system',
                            line: i,
                            value: systemValue || null
                        });
                        sublist.setSublistValue({
                            id: 'custpage_vendor',
                            line: i,
                            value: vendor || null
                        });
                    }

                    // Populate filter dropdowns
                    uniquePhases.forEach(phase => {
                        phaseField.addSelectOption({ value: phase, text: phase });
                    });

                    uniqueRooms.forEach(room => {
                        roomField.addSelectOption({ value: room, text: room });
                    });

                    uniqueSystems.forEach(system => {
                        systemField.addSelectOption({ value: system, text: system });
                    });

                    //Populating activity code:
                    // uniqueActivityCodes.forEach(code => {
                    //     activitycodeField.addSelectOption({ value: code, text: code });
                    // });

                    Object.keys(uniqueActivityCodes).forEach(id => {
                        activitycodeField.addSelectOption({
                            value: id,
                            text: uniqueActivityCodes[id]
                        });
                    });

                    log.debug("Populated values of activity code: ",uniqueActivityCodes)
                    
                    
                }

                // Buttons
                form.addButton({ id: 'custpage_loadSO', label: 'Load Sales Order', functionName: 'reloadWithFilters' });
                form.addSubmitButton({ label: 'Submit' });

                context.response.writePage(form);
            } else if (context.request.method === 'POST') {
                var request = context.request;
                var soInternalID = request.getSublistValue({
                    group: 'custpage_sublist',
                    name: 'custpage_int_id',
                    line: 0 // Pick from the first row, assuming all lines belong to the same SO
                });

                if (!soInternalID) {
                    log.error('Sales Order ID Missing', 'No Sales Order Internal ID found in the submitted data.');
                    context.response.write('<h2>Error</h2><p>Could not find Sales Order ID.</p>');
                    return;
                }
                // var soId = request.parameters.custpage_so_id;
                var selectedLines = [];

                // Identify selected lines
                var lineCount = request.getLineCount({ group: 'custpage_sublist' });
                for (var i = 0; i < lineCount; i++) {
                    var isSelected = request.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custpage_select',
                        line: i
                    });

                    if (isSelected === 'T') {
                        var lineKey = request.getSublistValue({
                            group: 'custpage_sublist',
                            name: 'custpage_key',
                            line: i
                        });

                        selectedLines.push(lineKey);
                    }
                }

                if (selectedLines.length > 0) {
                    log.audit('Selected Lines', selectedLines);

                    // Load the sales order
                    var salesOrder = record.load({
                        type: record.Type.SALES_ORDER,
                        id: soInternalID,
                        isDynamic: true
                    });

                    var soLineCount = salesOrder.getLineCount({ sublistId: 'item' });

                    for (var j = 0; j < soLineCount; j++) {
                        var soLineKey = salesOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'lineuniquekey',
                            line: j
                        });
                    
                        if (selectedLines.includes(soLineKey)) {
                            salesOrder.selectLine({ sublistId: 'item', line: j });
                    
                            salesOrder.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_tpc_rfp',
                                value: true // Set the RFP field to true
                            });
                    
                            salesOrder.commitLine({ sublistId: 'item' });
                    
                            log.audit('Updated RFP Value for Line ' + soLineKey, 'Set to true');
                        }
                    }

                    salesOrder.save();
                    log.audit('Sales Order Updated', 'Successfully set RFP values to true');
                } else {
                    log.error('No Lines Selected', 'User did not select any lines to process.');
                }

                context.response.write('<h2>Processing Complete</h2><p>Check logs for details.</p>');
                context.response.write(`
                    <button onclick="window.location.href='${url.resolveScript({
                        scriptId: 'customscript_tpc_sl_so_lines_procurement',  // Replace with your actual Suitelet script ID
                        deploymentId: 'customdeploy_tpc_sl_so_lines_procurement' // Replace with your actual deployment ID
                    })}'">OK</button>
                `);
            }
        } catch (error) {
            log.error({ title: 'Suitelet Error', details: error });
            context.response.write('<h2>Error Occurred</h2><p>' + (error.message || 'An unexpected error occurred.') + '</p>');
            context.response.write(`
                <button onclick="window.location.href='${url.resolveScript({
                    scriptId: 'customscript_tpc_sl_so_lines_procurement',  // Replace with your actual Suitelet script ID
                    deploymentId: 'customdeploy_tpc_sl_so_lines_procurement' // Replace with your actual deployment ID
                })}'">OK</button>
            `);
        }
    }

    return { onRequest: onRequest };
});
