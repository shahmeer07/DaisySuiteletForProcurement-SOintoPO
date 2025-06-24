/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
 define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/log', 'N/url'], function (serverWidget, search, record, log, url) {
    function onRequest(context) {
        try {
            if (context.request.method === 'GET') {
                var form = serverWidget.createForm({
                    title: 'Create PO from SO Lines'
                });

                form.clientScriptModulePath = '../ClientScript/tpc_cs_createPO.js';

                // Add a field group for Customer
                form.addFieldGroup({
                    id: 'custgroup_customer',
                    label: 'Customer Info'
                });

                var customerField = form.addField({
                    id: 'custpage_customer',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Customer',
                    source: 'customer',
                    container: 'custgroup_customer'
                });

                // Add a separate field group for Sales Order
                form.addFieldGroup({
                    id: 'custgroup_so',
                    label: 'Sales Order Info'
                });

                var SOIDField = form.addField({
                    id: 'custpage_so_id',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Sales Order ID',
                    container: 'custgroup_so'
                });

                SOIDField.addSelectOption({ value: '', text: 'Select Sales Order' });
                var selectedSOID = context.request.parameters.custpage_so_id || '';
                var selectedCustomer = context.request.parameters.custpage_customer || '';

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
                    log.debug("SO results: ",soResults)

                    for (var i = 0; i < soResults.length; i++) {
                        SOIDField.addSelectOption({
                            value: soResults[i].getValue('tranid'),
                            text: soResults[i].getValue('tranid')
                        });
                    }
                }

                SOIDField.defaultValue = selectedSOID;

                // Sublist for Sales Order Lines
                var sublist = form.addSublist({
                    id: 'custpage_sublist',
                    type: serverWidget.SublistType.LIST,
                    label: 'Sales Order Lines'
                });

                sublist.addMarkAllButtons();
                sublist.addField({ id: 'custpage_select', type: serverWidget.FieldType.CHECKBOX, label: 'create PO' });
                sublist.addField({ id: 'custpage_item', type: serverWidget.FieldType.TEXT, label: 'Item' });
                sublist.addField({ id: 'custpage_item_desc', type: serverWidget.FieldType.TEXT, label: 'Item Description' });
                sublist.addField({ id: 'custpage_quantity', type: serverWidget.FieldType.FLOAT, label: 'Quantity' });
                sublist.addField({ id: 'custpage_est_rate', type: serverWidget.FieldType.CURRENCY, label: 'Est Cost' });
                sublist.addField({ id: 'custpage_est', type: serverWidget.FieldType.CURRENCY, label: 'Extended Cost' });
                sublist.addField({ id: 'custpage_location', type: serverWidget.FieldType.TEXT, label: 'Location' });
                sublist.addField({ id: 'custpage_vendor', type: serverWidget.FieldType.SELECT, label: 'PFD Vendor', source: 'vendor' });
                sublist.addField({ id: 'custpage_key', type: serverWidget.FieldType.TEXT, label: 'Unique Key' });
                sublist.addField({ id: 'custpage_int_id', type: serverWidget.FieldType.TEXT, label: 'Internal ID' });
                sublist.addField({ id: 'custpage_rfp', type: serverWidget.FieldType.TEXT, label: 'RFP' });
                sublist.addField({ id: 'custpage_class', type: serverWidget.FieldType.TEXT, label: 'Class' });
                sublist.addField({ id: 'custpage_item_id', type: serverWidget.FieldType.TEXT, label: 'Item ID' });
                sublist.addField({ id: 'custpage_location_id', type: serverWidget.FieldType.TEXT, label: 'Location ID' });
                sublist.addField({ id: 'custpage_job_id', type: serverWidget.FieldType.TEXT, label: 'Project ID' });
                sublist.addField({ // Shahmeer - Adding Activity code on Suitelet
                    id: 'custpage_activity_code',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Activity Code'
                });

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
                        ['custcol_tpc_rfp', 'is', 'T'],
                        'AND',
                        ['custcol_tpc_linked_po', 'anyof', '@NONE@']
                    ];

                    const transactionSearchColItemSalesDescription = search.createColumn({ name: 'salesdescription', join: 'item' });
                    // const Item_description = search.createColumn({ name:"description"})
                    const transactionSearchColItemPreferredVendor = search.createColumn({ name: 'vendor', join: 'item' });
                    const transactionSearchColJobMainInternalId = search.createColumn({ name: 'internalid', join: 'jobmain' });
                    const activity_code = search.createColumn({ name: 'cseg_paactivitycode' ,join: "item"})
                    const searchColumns = [
                        search.createColumn({ name: 'internalid' }),
                        search.createColumn({ name: 'item' }),
                        search.createColumn({ name: 'memo' }),
                        transactionSearchColItemSalesDescription,
                        search.createColumn({ name: 'quantity' }),
                        search.createColumn({ name: 'rate' }),
                        search.createColumn({ name: 'location' }),
                        search.createColumn({ name: 'lineuniquekey' }),
                        search.createColumn({ name: 'costestimaterate' }),
                        search.createColumn({ name: 'costestimate' }),
                        search.createColumn({ name: 'custcol_tpc_rfp' }),
                        search.createColumn({ name: 'class' }),
                        activity_code,
                         // Shahmeer - Adding Activity Code to place it later on On PO lines
                        transactionSearchColItemPreferredVendor,
                        transactionSearchColJobMainInternalId
                    ];



                    var salesOrderSearch = search.create({
                        type: 'salesorder',
                        filters: searchFilters,
                        columns: searchColumns
                    });
                    var resultSet = salesOrderSearch.run().getRange({ start: 0, end: 100 });
                    log.debug("results of Sales order search: ",resultSet)
                    
                    for (var i = 0; i < resultSet.length; i++) {
                        var vendor = resultSet[i].getValue(transactionSearchColItemPreferredVendor);

                        sublist.setSublistValue({
                            id: 'custpage_int_id',
                            line: i,
                            value: resultSet[i].getValue('internalId') || ''
                        });
                        sublist.setSublistValue({
                            id: 'custpage_key',
                            line: i,
                            value: resultSet[i].getValue('lineuniquekey')
                        });
                        sublist.setSublistValue({
                            id: 'custpage_rfp',
                            line: i,
                            value: resultSet[i].getValue('custcol_tpc_rfp') == true ? 'T' : 'F'
                        });
                        sublist.setSublistValue({
                            id: 'custpage_item_id',
                            line: i,
                            value: resultSet[i].getValue('item')
                        });
                        sublist.setSublistValue({
                            id: 'custpage_item',
                            line: i,
                            value: resultSet[i].getText('item')
                        });
                        // Setting value from sales order first - if its not there we shall add it from item record itself
                        sublist.setSublistValue({
                            id: 'custpage_item_desc',
                            line: i,
                            value:  resultSet[i].getValue("memo") || resultSet[i].getValue(transactionSearchColItemSalesDescription) || resultSet[i].getText("item") || null
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
                        sublist.setSublistValue({
                            id: 'custpage_location',
                            line: i,
                            value: resultSet[i].getText('location')
                        });
                        sublist.setSublistValue({
                            id: 'custpage_location_id',
                            line: i,
                            value: resultSet[i].getValue('location')
                        });
                        sublist.setSublistValue({
                            id: 'custpage_job_id',
                            line: i,
                            value: resultSet[i].getValue(transactionSearchColJobMainInternalId) || null
                        });
                        sublist.setSublistValue({
                            id: 'custpage_class',
                            line: i,
                            value: resultSet[i].getValue('class')
                        });
                        sublist.setSublistValue({
                            id: 'custpage_vendor',
                            line: i,
                            value: vendor || null
                        });
                        var activityCodeId = resultSet[i].getValue(activity_code);
                        var activityCodeText = resultSet[i].getText(activity_code);

                        log.debug("Activity Code ID:", activityCodeId);
                        log.debug("Activity Code Text:", activityCodeText);

                        log.debug('Item Description chosen', {
                            line: i,
                            soLine: resultSet[i].getText('item'),
                            fallback: transactionSearchColItemSalesDescription
                        });

                       if(activity_code){
                        sublist.setSublistValue({ // Shahmeer - Setting activity code field
                            id: 'custpage_activity_code',
                            line: i,
                            value: resultSet[i].getValue(activity_code) || ''
                        });
                       }
                        
                    }
                }

                // Buttons
                form.addButton({ id: 'custpage_loadSO', label: 'Load Sales Order', functionName: 'reloadWithFilters' });
                form.addSubmitButton({ label: 'Submit' });

                context.response.writePage(form);
            } else if (context.request.method === 'POST') {
                try {
                    var request = context.request;
                    var lineCount = request.getLineCount({ group: 'custpage_sublist' });
            
                    var errorMessages = [];
                    var successfulLines = [];
                    var vendorGroups = {}; // Grouping lines by vendor
                    var lineToPOMap = {};  // Store PO ID for each sales order line
            
                    // Loop through the sublist to find checked lines
                    for (var i = 0; i < lineCount; i++) {
                        var isSelected = request.getSublistValue({
                            group: 'custpage_sublist',
                            name: 'custpage_select',
                            line: i
                        });
            
                        if (isSelected === 'T') {
                            var soInternalId = request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_int_id', line: i });
                            log.debug("Setting Internal id on line " + i + " :" ,soInternalId)
                            var lineUniqueKey = request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_key', line: i });
                            log.debug("Setting lineUniqueKey on line " + i + " :" ,lineUniqueKey)
                            var item = request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_item_id', line: i });
                            log.debug("Setting item on line " + i + " :" ,item)
                            var itemdesc = request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_item_desc', line: i });
                            log.debug("Setting item on line " + i + " :" ,item)
                            var quantity = request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_quantity', line: i });
                            log.debug("Setting quantity on line " + i + " :" ,quantity)
                            var vendor = request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_vendor', line: i });
                            log.debug("Setting vendor on line " + i + " :" ,vendor)
                            var rate = request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_est_rate', line: i });
                            log.debug("Setting rate on line " + i + " :" ,rate)
                            var location = request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_location_id', line: i });
                            log.debug("Setting location on line " + i + " :" ,location)
                            var _class = request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_class', line: i });
                            log.debug("Setting _class on line " + i + " :" ,_class)
                            var job = request.getSublistValue({ group: 'custpage_sublist', name: 'custpage_job_id', line: i });
                            log.debug("Setting job on line " + i + " :" ,job)
                            var activityCode = request.getSublistValue({ // Getting value of activity code
                                group: 'custpage_sublist',
                                name: 'custpage_activity_code',
                                line: i
                            }) || null
                            
                            
                            log.debug("Activity code in Post PO creation: ",activityCode)
                            if (!vendor) {
                                var vendorMissingError = `Skipping line ${item} because it has no vendor.`;
                                log.error('Vendor Missing', vendorMissingError);
                                errorMessages.push(vendorMissingError);
                                continue;
                            }
            
                            // Store line info
                            var lineData = { soInternalId, lineUniqueKey, item, quantity, vendor, rate, location, _class, job ,activityCode,itemdesc};
            
                            // Grouping lines by vendor
                            if (!vendorGroups[vendor]) {
                                vendorGroups[vendor] = [];
                            }
                            vendorGroups[vendor].push(lineData);
                        }
                    }
            
                    if (Object.keys(vendorGroups).length === 0) {
                        var noSelectionError = 'No valid lines selected for purchase order creation.';
                        log.error('No Lines Selected', noSelectionError);
                        errorMessages.push(noSelectionError);
                    } else {
                        // Process each vendor group and create one PO per vendor
                        for (var vendorId in vendorGroups) {
                            try {
                                log.debug("looking at Vendor Id Number: ",vendorId)
                                log.debug("Array of Vendor Ids found: ",vendorGroups)
                                var purchaseOrder = record.create({ type: record.Type.PURCHASE_ORDER, isDynamic: true });
                                purchaseOrder.setValue({ fieldId: 'entity', value: vendorId }); // Assign Vendor

                                // Set 'custbody_tpc_custom_created_from' from the first line's SO Internal ID
                                if (vendorGroups[vendorId] && vendorGroups[vendorId].length > 0) {
                                    purchaseOrder.setValue({
                                        fieldId: 'custbody_tpc_custom_created_from',
                                        value: vendorGroups[vendorId][0].soInternalId
                                    });

                                    // Shahmeer - Setting Subsidiary first

                                    var soRecord = record.load({
                                        type: record.Type.SALES_ORDER,
                                        id: vendorGroups[vendorId][0].soInternalId
                                    })

                                    var soSubsidiary = soRecord.getValue({ fieldId: "subsidiary"})

                                    purchaseOrder.setValue({fieldId: "subsidiary" , value: soSubsidiary})
                                    log.debug("Subsidiary value set: ",soSubsidiary)
                                    /////
                                    purchaseOrder.setValue({
                                        fieldId: 'location',
                                        value: vendorGroups[vendorId][0].location
                                    });
                                } else {
                                    log.error('Vendor group empty', vendorId);
                                    throw new Error('No lines found for vendor: ' + vendorId);
                                }

                                log.debug("Passed the If statment")
            
                                // temporarily commented
                                // vendorGroups[vendorId].forEach(function (line) {
                                //     purchaseOrder.selectNewLine({ sublistId: 'item' });
                                //     purchaseOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: line.item });
                                //     purchaseOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: line.quantity });
                                //     purchaseOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: line.rate });
                                //     purchaseOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: line._class });
                                //     // purchaseOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'customer', value: context.request.parameters.custpage_customer });
                                //     if (!!line.job && line.job !== null) {
                                //         purchaseOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'customer', value: line.job });
                                //     }
                                //     purchaseOrder.commitLine({ sublistId: 'item' });
                                // });

                                // Group lines by item+rate for combining quantities
                                const itemRateGroups = {};

                                vendorGroups[vendorId].forEach(function (line) {
                                    const key = `${line.item}-${line.rate}-${line.activityCode || 'none'}`;

                                    if (!itemRateGroups[key]) {
                                        itemRateGroups[key] = {
                                            item: line.item,
                                            rate: line.rate,
                                            quantity: parseFloat(line.quantity),
                                            _class: line._class,
                                            job: line.job,
                                            location: line.location,
                                            activityCode: line.activityCode,
                                            itemdesc: line.itemdesc
                                        };
                                    } else {
                                        itemRateGroups[key].quantity += parseFloat(line.quantity);
                                    }
                                });

                                // Add one PO line per item+rate group
                                for (const key in itemRateGroups) {
                                    const group = itemRateGroups[key];

                                    purchaseOrder.selectNewLine({ sublistId: 'item' });
                                    // purchaseOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: group.item });

                                    try {
                                        if (!group.item || isNaN(parseInt(group.item))) {
                                          throw new Error(`Invalid item ID: ${group.item}`);
                                        }
                                      
                                        purchaseOrder.setCurrentSublistValue({
                                          sublistId: 'item',
                                          fieldId: 'item',
                                          value: group.item
                                        });
                                      } catch (e) {
                                        throw new Error(`PO line error - Item ID: ${group.item}, Vendor: ${vendorId}, Qty: ${group.quantity}, Rate: ${group.rate}. Message: ${e.message}`);
                                      }

                                    purchaseOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: group.quantity });
                                    purchaseOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'description', value: group.itemdesc });
                                    purchaseOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: group.rate });
                                    purchaseOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: group._class });
                                    if (group.activityCode) {
                                        purchaseOrder.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'cseg_paactivitycode', // Shahmeer - setting AC value on PO
                                            value: group.activityCode
                                        });
                                    }
                                    if (!!group.job && group.job !== null) {
                                        purchaseOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'customer', value: group.job });
                                    }
                                    purchaseOrder.commitLine({ sublistId: 'item' });
                                }
            
                                var poId = purchaseOrder.save();
                                var poUrl = url.resolveRecord({
                                    recordType: record.Type.PURCHASE_ORDER,
                                    recordId: poId,
                                    isEditMode: false
                                });
                                var poRec = record.load({
                                    type: record.Type.PURCHASE_ORDER,
                                    id: poId
                                });
                                var poNum = poRec.getValue('tranid');
                                var successMessage = `PO ID: <a href="${poUrl}" target="_blank">${poNum}</a> created for Vendor: ${vendorId}`;
                                log.audit('Purchase Order Created', successMessage);
                                successfulLines.push(successMessage);
            
                                // Store the PO ID for each line
                                vendorGroups[vendorId].forEach(function (line) {
                                    lineToPOMap[line.soInternalId + '-' + line.lineUniqueKey] = {
                                        poId: poId,
                                        vendorId: vendorId
                                    };
                                });
                            } catch (poError) {
                                var poCreationError = `Error creating PO for vendor ${vendorId}: ${poError.message}`;
                                log.error('Purchase Order Creation Failed', poCreationError);
                                errorMessages.push(poCreationError);
                            }
                        }
                    }
            
                    // **Now update Sales Order Lines with the PO ID**
                    for (var key in lineToPOMap) {
                        try {
                            var [soInternalId, lineUniqueKey] = key.split('-');
                            var { poId, vendorId } = lineToPOMap[key];
            
                            var salesOrder = record.load({
                                type: record.Type.SALES_ORDER,
                                id: soInternalId,
                                isDynamic: false
                            });
            
                            var soLineCount = salesOrder.getLineCount({ sublistId: 'item' });
            
                            for (var i = 0; i < soLineCount; i++) {
                                var currentLineKey = salesOrder.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'lineuniquekey',
                                    line: i
                                });
            
                                if (currentLineKey === lineUniqueKey) {
                                    salesOrder.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_tpc_linked_po',
                                        line: i,
                                        value: poId
                                    });

                                    // log.debug("Vendor Id for updating in SO: ",vendorId)
                                    // salesOrder.setSublistValue({
                                    //     sublistId: 'item',
                                    //     fieldId: 'povendor',
                                    //     line: i,
                                    //     value: vendorId
                                    // });
                                    break;
                                }
                            }
            
                            salesOrder.save();
                            log.audit('Updated Sales Order', `SO ID: ${soInternalId}, Line Key: ${lineUniqueKey}, PO ID: ${poId}, Vendor ID: ${vendorId}`);
                        } catch (updateError) {
                            var updateErrorMessage = `Error updating SO Line for SO ID ${soInternalId}: ${updateError.message}`;
                            log.error('Sales Order Update Failed', updateErrorMessage);
                            errorMessages.push(updateErrorMessage);
                        }
                    }
            
                    // Output error messages if any
                    if (errorMessages.length > 0) {
                        context.response.write('<h2>Errors Occurred</h2><ul>');
                        errorMessages.forEach(function (errorMsg) {
                            context.response.write('<li>' + errorMsg + '</li>');
                        });
                        context.response.write('</ul>');
                    } else {
                        // Output successful purchase order creation details
                        context.response.write('<h2>Purchase Orders Created Successfully</h2><ul>');
                        successfulLines.forEach(function (successMsg) {
                            context.response.write('<li>' + successMsg + '</li>');
                        });
                        context.response.write('</ul>');
                    }
            
                    // **Add "OK" button to return**
                    context.response.write(`
                        <button onclick="window.location.href='${url.resolveScript({
                            scriptId: 'customscript_tpc_sl_create_po',
                            deploymentId: 'customdeploy_tpc_sl_create_po'
                        })}'">OK</button>
                    `);
            
                } catch (error) {
                    log.error({ title: 'Error Processing Request', details: error });
                    context.response.write('<h2>Error</h2><p>' + (error.message || 'An unexpected error occurred.') + '</p>');
                    // Add "OK / Return" button
                    context.response.write(`
                        <button onclick="window.location.href='${url.resolveScript({
                            scriptId: 'customscript_tpc_sl_create_po',
                            deploymentId: 'customdeploy_tpc_sl_create_po'
                        })}'">OK</button>
                    `);
                }
            }
            
            
            
        } catch (error) {
            log.error({ title: 'Suitelet Error', details: error });
            context.response.write('<h2>Error Occurred</h2><p>' + (error.message || 'An unexpected error occurred.') + '</p>');
        }
    }


    

    return { onRequest: onRequest };
});
