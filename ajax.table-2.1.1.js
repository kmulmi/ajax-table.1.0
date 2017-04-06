(function ($) {

    $.fn.ajaxTable = function (options) {
        var _wrapper = $(this);
        var _defaults = {
            init: false,
            sn: true,
            url: "",
            offset: 0,
            limit: 10,
            page: 1,
            columns: [],
            goPagination: false,
            numberPagination: true,
            currentPage: 1,
            beforeNextRow: false,
            noRecord: "No record found",
            limitOption: [5, 10, 20, 50, 100],
            filter: false,
            previous: "&laquo;",
            next: "&raquo;",
            loadMore: false,
            rowSortable: false,
            loadingClass: false,


        };
        var _settings = $.extend({}, _defaults, options);
        var _data = {data: [], count: 0};
        var xhr;
        /*some global variable*/
        var _noOfPages = 1;

        var table = {
            _init: function () {
                table._begin();
            },
            _begin: function () {
                _wrapper.on("refreshGrid", function (event, jsonParameters) {
                    _settings.filter = jsonParameters;
                    table._reset();
                    table._create();
                    pagination._init();
                });

                table._create();
                pagination._init();

                if (_settings.rowSortable) {
                    table._makeRowSortable();
                }
            },
            _create: function () {
                var sn = _settings.offset + 1;
                if (_settings.loadMore == false) table._clear();

                if (_settings.loadingClass) {
                    $(_settings.loadingClass).show();
                }
                if (xhr && xhr.readyState != 4 && xhr.readyState != 0) {
                    xhr.abort();
                }

                xhr =  $.ajax({
                    'url': _settings.url,
                    'data': {
                        offset: _settings.offset,
                        limit: _settings.limit,
                        page: _settings.page,
                        filter: _settings.filter
                    },
                    'dataType': "json",
                    'success': function (data) {
                        _data = data;
                        _noOfPages = Math.ceil(data.count / _settings.limit);


                        if (_settings.loadingClass) {
                            $(_settings.loadingClass).hide();
                        }

                        if (_data.count > 0) {
                            _data.data.forEach(function (dt) {
                                if (_settings.beforeNextRow) {
                                    var tempTr = $("<tr/>");
                                    var result = _settings.beforeNextRow.call(this, dt);
                                    var tempTd = $("<td colspan='" + table._totalColumns() + "'/>");
                                    tempTd.append(result);
                                    tempTr.append(tempTd);
                                    _wrapper.find('tbody').append(tempTr);
                                }


                                var tr = $("<tr/>");
                                if (_settings.sn) {
                                    var td = $("<td/>");
                                    td.append(sn++);
                                    tr.append(td);
                                }
                                _settings.columns.forEach(function (items) {
                                    var td = $("<td/>");
                                    if (typeof items.attr != "undefined") {
                                        td = $("<td " + items.attr + "/>")
                                    }

                                    if (typeof items.data != "undefined") {
                                        td.append(dt[items.data]);
                                    } else if (typeof items.mRender != "undefined") {
                                        var customField = items.mRender.call(this, dt);
                                        td.append(customField);
                                    }

                                    if (typeof items.rowData != "undefined") {
                                        tr.attr("row-data", dt[items.rowData]);
                                    } else {
                                        tr.append(td);
                                    }

                                });
                                _wrapper.find('tbody').append(tr);
                            });
                        } else {
                            var colspan = table._totalColumns();
                            if (_settings.sn) colspan += 1;
                            _wrapper.find('tbody').append("<tr><td colspan='" + colspan + "'>" + _settings.noRecord + "</td></tr>");
                        }


                    }
                });
            },
            _totalColumns: function () {
                return _settings.columns.length;
            },
            _refresh: function () {
                table._begin()
            },
            _reset: function () {
                _settings.offset = _defaults.offset;
                _settings.limit = _defaults.limit;
                _settings.currentPage = _defaults.currentPage;
            },
            _clear: function () {
                _wrapper.find('tbody').html("");
            },
            _makeRowSortable: function () {
                var previousOrder = [];
                var previousOrderArr = _wrapper.find('tbody tr');
                previousOrderArr.each(function () {
                    previousOrder.push($(this).attr('row-data'));
                });

                _wrapper.find('tbody').sortable({
                    axis: 'y',
                    update: function (event, ui) {
                        var latestOrder = [];
                        var latestOrderArr = _wrapper.find('tbody tr');
                        latestOrderArr.each(function () {
                            latestOrder.push($(this).attr('row-data'));
                        });

                        var hash = {};

                        for (var i = 0; i < previousOrder.length; i++) {
                            if (previousOrder[i] != latestOrder[i])
                                hash[previousOrder[i].toString()] = latestOrder[i].toString();
                        }
                        _settings.rowSortable.call(this, hash);
                        //console.log(hash);
                    }
                });
            }
        };

        var pagination = {
            _init: function () {
                pagination._create();
                pagination._enableDisable();
            },
            _create: function () {
                var paginationNav = $('<nav aria-label="Page navigation" id="PageNavigation"/>');
                var paginationUl = $('<ul class="pagination"/>');

                if (_settings.loadMore == false) {
                    paginationUl.append('<li id="ajax-table-previous-button"><a role="button" onclick="ajax_grid_previous_button()" aria-label="Previous" style="margin-right: 10px;"><span aria-hidden="true" >' + _settings.previous + '</span></a></li>');

                    if (_settings.goPagination) {
                        paginationUl.append('<li ><span>Page</span></li>');
                        paginationUl.append('<li ><span id="ajax-table-page-no" contenteditable="true">' + _settings.currentPage + '</span></li>');
                        paginationUl.append('<li id="ajax-table-goto-page"><a role="button"  aria-label="Go" style="margin-right: 5px;"><span>Go !</span></a></li>');
                    }
                    if (_settings.numberPagination) {
                        paginationUl.append(pagination._numberPagination());
                    }
                    paginationUl.append('<li id="ajax-table-next-button"><a role="button" aria-label="Next" style="margin-left: 5px;" ><span aria-hidden="true">' + _settings.next + '</span></a></li>');
                } else {
                    paginationUl.append('<li id="ajax-table-next-button"><a role="button" aria-label="Next" style="margin-left: 5px;" ><span aria-hidden="true">Load More</span></a></li>');
                }

                paginationNav.append(paginationUl);
                _wrapper.parent().find("#PageNavigation").remove();
                if (_noOfPages > 0) {
                    _wrapper.after(paginationNav);
                }

                footer._init();
            },
            _numberPagination: function () {
                var currentPageNo = _settings.currentPage;
                var paginationExtraBtns = "";
                if (_noOfPages < 5) {
                    var i = 1;
                    while (i < _noOfPages + 1) {
                        if (i == currentPageNo) paginationExtraBtns += getButton(i, "active");
                        else paginationExtraBtns += getButton(i);
                        i++;
                    }
                } else {
                    if (currentPageNo == 1) {
                        paginationExtraBtns += getButton(currentPageNo, "active");
                        paginationExtraBtns += getButton(currentPageNo + 1);
                        paginationExtraBtns += getButton(currentPageNo + 2);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(_noOfPages);
                    } else if (currentPageNo == 2) {
                        paginationExtraBtns += getButton(currentPageNo - 1);
                        paginationExtraBtns += getButton(currentPageNo, "active");
                        paginationExtraBtns += getButton(currentPageNo + 1);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(_noOfPages);
                    } else if (currentPageNo == 3) {
                        paginationExtraBtns += getButton(currentPageNo - 2);
                        paginationExtraBtns += getButton(currentPageNo - 1);
                        paginationExtraBtns += getButton(currentPageNo, "active");
                        paginationExtraBtns += getButton(currentPageNo + 1);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(_noOfPages);
                    } else if (currentPageNo == (_noOfPages - 2)) {
                        paginationExtraBtns += getButton(1);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(currentPageNo - 1);
                        paginationExtraBtns += getButton(currentPageNo, "active");
                        paginationExtraBtns += getButton(currentPageNo + 1);
                        paginationExtraBtns += getButton(currentPageNo + 2);
                    } else if (currentPageNo == (_noOfPages - 1)) {
                        paginationExtraBtns += getButton(1);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(currentPageNo - 1);
                        paginationExtraBtns += getButton(currentPageNo, "active");
                        paginationExtraBtns += getButton(currentPageNo + 1);
                    } else if (currentPageNo == _noOfPages) {
                        paginationExtraBtns += getButton(1);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(currentPageNo - 2);
                        paginationExtraBtns += getButton(currentPageNo - 1);
                        paginationExtraBtns += getButton(currentPageNo, "active");
                    } else {
                        paginationExtraBtns += getButton(1);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(currentPageNo - 1);
                        paginationExtraBtns += getButton(currentPageNo, "active");
                        paginationExtraBtns += getButton(currentPageNo + 1);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(_noOfPages);
                    }
                }

                return paginationExtraBtns;

                function getButton(pageNo, isActive) {
                    return '<li class="' + isActive + '"><a role="button" class="ajax-table-pagination-btn" page-no="' + pageNo + '">' + pageNo + '</a></li>';
                }
            },
            _previousPage: function () {
                if ($(this).attr("class") != "disabled") {
                    _settings.offset -= _settings.limit;
                    _settings.currentPage -= 1;
                    table._refresh();
                }
            },
            _nextPage: function () {
                if ($(this).attr("class") != "disabled") {
                    _settings.offset += _settings.limit;
                    _settings.currentPage += 1;
                    table._refresh();
(function ($) {

    $.fn.ajaxTable = function (options) {
        var _wrapper = $(this);
        var _defaults = {
            init: false,
            sn: true,
            url: "",
            offset: 0,
            limit: 10,
            page: 1,
            columns: [],
            goPagination: false,
            numberPagination: true,
            currentPage: 1,
            beforeNextRow: false,
            noRecord: "No record found",
            limitOption: [5, 10, 20, 50, 100],
            filter: false,
            previous: "&laquo;",
            next: "&raquo;",
            loadMore: false,
            rowSortable: false,
            loadingClass: false,


        };
        var _settings = $.extend({}, _defaults, options);
        var _data = {data: [], count: 0};
        var xhr;
        var dataFetching = false;
        /*some global variable*/
        var _noOfPages = 1;
        var _filterParams = "";
        if (_settings.filter) {
            _filterParams = _settings.filter;
        }

        var table = {
            _init: function () {
                table._begin();
            },
            _begin: function () {
                _wrapper.on("refreshGrid", function (event, jsonParameters) {
                    _settings.filter = jsonParameters;
                    table._reset();
                    table._process();
                });

                table._process();

                if (_settings.rowSortable) {
                    table._makeRowSortable();
                }
            },
            _process: function () {

                if (!_settings.init) {

                    if (_settings.loadingClass) {
                        $(_settings.loadingClass).show();
                    }

                    if (xhr && xhr.readyState != 4 && xhr.readyState != 0) {
                        xhr.abort();
                    }

                    dataFetching = true;

                    xhr = $.ajax({
                        'url': _settings.url,
                        'data': {
                            offset: _settings.offset,
                            limit: _settings.limit,
                            page: _settings.page,
                            filter: _filterParams
                        },
                        'dataType': "json",
                        'success': function (data) {

                            dataFetching = false;
                            _data = data;
                            _noOfPages = Math.ceil(data.count / _settings.limit);

                            table._create();
                            pagination._init();

                            if (_settings.loadingClass) {
                                $(_settings.loadingClass).hide();
                            }

                            if (_settings.rowSortable) {
                                table._makeRowSortable();
                            }
                        }
                    });
                } else {
                    _settings.init = false;
                    if(_settings.loadingClass) {
                        $(_settings.loadingClass).hide()
                    }
                }
            },
            _create: function () {

                var sn = _settings.offset + 1;
                if (_settings.loadMore == false) table._clear();

                if (_data.count > 0) {
                    _data.data.forEach(function (dt) {
                        if (_settings.beforeNextRow) {
                            var tempTr = $("<tr/>");
                            var result = _settings.beforeNextRow.call(this, dt);
                            var tempTd = $("<td colspan='" + table._totalColumns() + "'/>");
                            tempTd.append(result);
                            tempTr.append(tempTd);
                            _wrapper.find('tbody').append(tempTr);
                        }


                        var tr = $("<tr/>");
                        if (_settings.sn) {
                            var td = $("<td/>");
                            td.append(sn++);
                            tr.append(td);
                        }
                        _settings.columns.forEach(function (items) {
                            var td = $("<td/>");
                            if (typeof items.attr != "undefined") {
                                td = $("<td " + items.attr + "/>")
                            }

                            if (typeof items.data != "undefined") {
                                td.append(dt[items.data]);
                            } else if (typeof items.mRender != "undefined") {
                                var customField = items.mRender.call(this, dt);
                                td.append(customField);
                            }

                            if (typeof items.rowData != "undefined") {
                                tr.attr("row-data", dt[items.rowData]);
                            } else {
                                tr.append(td);
                            }

                        });
                        _wrapper.find('tbody').append(tr);
                    });
                } else {
                    var colspan = table._totalColumns();
                    if (_settings.sn) colspan += 1;
                    _wrapper.find('tbody').append("<tr><td colspan='" + colspan + "'>" + _settings.noRecord + "</td></tr>");
                }

            },
            _totalColumns: function () {
                return _settings.columns.length;
            },
            _refresh: function () {
                table._begin()
            },
            _reset: function () {
                _settings.offset = _defaults.offset;
                _settings.limit = _defaults.limit;
                _settings.currentPage = _defaults.currentPage;
            },
            _clear: function () {
                _wrapper.find('tbody').html("");
            },
            _makeRowSortable: function () {
                var previousOrder = [];
                var previousOrderArr = _wrapper.find('tbody tr');
                previousOrderArr.each(function () {
                    previousOrder.push($(this).attr('row-data'));
                });

                _wrapper.find('tbody').sortable({
                    axis: 'y',
                    update: function (event, ui) {
                        var latestOrder = [];
                        var latestOrderArr = _wrapper.find('tbody tr');
                        latestOrderArr.each(function () {
                            latestOrder.push($(this).attr('row-data'));
                        });

                        var hash = {};

                        for (var i = 0; i < previousOrder.length; i++) {
                            if (previousOrder[i] != latestOrder[i])
                                hash[previousOrder[i].toString()] = latestOrder[i].toString();
                        }
                        _settings.rowSortable.call(this, hash);
                        //console.log(hash);
                    }
                });
            }
        };

        var pagination = {
            _init: function () {
                pagination._create();
                pagination._enableDisable();
            },
            _create: function () {
                var paginationNav = $('<nav aria-label="Page navigation" id="PageNavigation"/>');
                var paginationUl = $('<ul class="pagination"/>');

                if (_settings.loadMore == false) {
                    paginationUl.append('<li id="ajax-table-previous-button"><a role="button" onclick="ajax_grid_previous_button()" aria-label="Previous" style="margin-right: 10px;"><span aria-hidden="true" >' + _settings.previous + '</span></a></li>');

                    if (_settings.goPagination) {
                        paginationUl.append('<li ><span>Page</span></li>');
                        paginationUl.append('<li ><span id="ajax-table-page-no" contenteditable="true">' + _settings.currentPage + '</span></li>');
                        paginationUl.append('<li id="ajax-table-goto-page"><a role="button"  aria-label="Go" style="margin-right: 5px;"><span>Go !</span></a></li>');
                    }
                    if (_settings.numberPagination) {
                        paginationUl.append(pagination._numberPagination());
                    }
                    paginationUl.append('<li id="ajax-table-next-button"><a role="button" aria-label="Next" style="margin-left: 5px;" ><span aria-hidden="true">' + _settings.next + '</span></a></li>');
                } else {
                    paginationUl.append('<li id="ajax-table-next-button"><a role="button" aria-label="Next" style="margin-left: 5px;" ><span aria-hidden="true">Load More</span></a></li>');
                }

                paginationNav.append(paginationUl);
                _wrapper.parent().find("#PageNavigation").remove();
                if (_noOfPages > 0) {
                    _wrapper.after(paginationNav);
                }

                footer._init();
            },
            _numberPagination: function () {
                var currentPageNo = _settings.currentPage;
                var paginationExtraBtns = "";
                if (_noOfPages < 5) {
                    var i = 1;
                    while (i < _noOfPages + 1) {
                        if (i == currentPageNo) paginationExtraBtns += getButton(i, "active");
                        else paginationExtraBtns += getButton(i);
                        i++;
                    }
                } else {
                    if (currentPageNo == 1) {
                        paginationExtraBtns += getButton(currentPageNo, "active");
                        paginationExtraBtns += getButton(currentPageNo + 1);
                        paginationExtraBtns += getButton(currentPageNo + 2);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(_noOfPages);
                    } else if (currentPageNo == 2) {
                        paginationExtraBtns += getButton(currentPageNo - 1);
                        paginationExtraBtns += getButton(currentPageNo, "active");
                        paginationExtraBtns += getButton(currentPageNo + 1);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(_noOfPages);
                    } else if (currentPageNo == 3) {
                        paginationExtraBtns += getButton(currentPageNo - 2);
                        paginationExtraBtns += getButton(currentPageNo - 1);
                        paginationExtraBtns += getButton(currentPageNo, "active");
                        paginationExtraBtns += getButton(currentPageNo + 1);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(_noOfPages);
                    } else if (currentPageNo == (_noOfPages - 2)) {
                        paginationExtraBtns += getButton(1);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(currentPageNo - 1);
                        paginationExtraBtns += getButton(currentPageNo, "active");
                        paginationExtraBtns += getButton(currentPageNo + 1);
                        paginationExtraBtns += getButton(currentPageNo + 2);
                    } else if (currentPageNo == (_noOfPages - 1)) {
                        paginationExtraBtns += getButton(1);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(currentPageNo - 1);
                        paginationExtraBtns += getButton(currentPageNo, "active");
                        paginationExtraBtns += getButton(currentPageNo + 1);
                    } else if (currentPageNo == _noOfPages) {
                        paginationExtraBtns += getButton(1);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(currentPageNo - 2);
                        paginationExtraBtns += getButton(currentPageNo - 1);
                        paginationExtraBtns += getButton(currentPageNo, "active");
                    } else {
                        paginationExtraBtns += getButton(1);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(currentPageNo - 1);
                        paginationExtraBtns += getButton(currentPageNo, "active");
                        paginationExtraBtns += getButton(currentPageNo + 1);
                        paginationExtraBtns += "<li><span>...</span></li>";
                        paginationExtraBtns += getButton(_noOfPages);
                    }
                }

                return paginationExtraBtns;

                function getButton(pageNo, isActive) {
                    return '<li class="' + isActive + '"><a role="button" class="ajax-table-pagination-btn" page-no="' + pageNo + '">' + pageNo + '</a></li>';
                }
            },
            _previousPage: function () {
                if ($(this).attr("class") != "disabled") {
                    _settings.offset -= _settings.limit;
                    _settings.currentPage -= 1;
                    table._refresh();
                }
            },
            _nextPage: function () {
                if ($(this).attr("class") != "disabled") {
                    _settings.offset += _settings.limit;
                    _settings.currentPage += 1;
                    table._refresh();
                }
            },
            _goToPage: function (pageNo) {
                if (($("#ajax-table-goto-page").attr("class") != "disabled" && !isNaN(parseInt($("#ajax-table-page-no").text()))) || !isNaN(pageNo)) {
                    _settings.currentPage = parseInt($("#ajax-table-page-no").text());
                    if (!isNaN(pageNo)) _settings.currentPage = parseInt(pageNo);
                    _settings.offset = (_settings.currentPage - 1) * _settings.limit;
                    table._refresh();
                }
            },
            _refresh: function () {
                pagination._init();
            },
            _disableGo: function () {
                var pageNo = parseInt($(this).text());
                var gotoPage = $("#ajax-table-goto-page");
                $("#ajax-table-previous-button").addClass("disabled");
                $("#ajax-table-next-button").addClass("disabled");
                if (isNaN(pageNo) || pageNo > _noOfPages) gotoPage.addClass("disabled");
                else gotoPage.removeClass("disabled");
            },
            _enableDisable: function () {
                var pageNo = _settings.currentPage;
                if (pageNo < 2) $("#ajax-table-previous-button").addClass("disabled");
                if ((pageNo >= _noOfPages)) $("#ajax-table-next-button").addClass("disabled");
            },
            _paginationButtonsClick: function () {
                var pageNo = parseInt($(this).attr("page-no"));
                pagination._goToPage(pageNo);
            }
        };

        var footer = {
            _init: function () {
                var paginationDiv = $(".pagination");
                var msg = "<i id='footer-message' style='line-height: 32px; margin-left: 10px;'>" +
                    "Showing " + (_settings.offset + 1) + " to " + (_settings.offset + _data.data.length) + " of " + _data.count + " entries" +
                    "</i>";
                paginationDiv.find("#footer-message").remove();
                paginationDiv.append("<li>" + msg + "</li>");
            }
        };

        table._init();

        _wrapper.parent().on('click', "#ajax-table-previous-button", pagination._previousPage);
        _wrapper.parent().on('click', '#ajax-table-next-button', pagination._nextPage);
        _wrapper.parent().on('click', '#ajax-table-goto-page', pagination._goToPage);
        _wrapper.parent().on('keyup', '#ajax-table-page-no', pagination._disableGo);
        _wrapper.parent().on('click', '.ajax-table-pagination-btn', pagination._paginationButtonsClick);
    }

})(jQuery);
