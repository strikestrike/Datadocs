<script>
  import {
    faBorderStyle,
    // faCalendar,
    // faFolder,
  } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";
  import img_fmt_accounting from "./icon-imgs/format/icon_fmt_accounting.svg?raw";
  import img_fmt_accounting_active from "./icon-imgs/format/icon_fmt_accounting_active.svg?raw";
  import img_fmt_automatic from "./icon-imgs/format/icon_fmt_automatic.svg?raw";
  import img_fmt_currency from "./icon-imgs/format/icon_fmt_currency.svg?raw";
  import img_fmt_currency_rounded from "./icon-imgs/format/icon_fmt_currency_rounded.svg?raw";
  import img_fmt_date from "./icon-imgs/format/icon_fmt_date.svg?raw";
  import img_fmt_date_time from "./icon-imgs/format/icon_fmt_date_time.svg?raw";
  import img_fmt_duration from "./icon-imgs/format/icon_fmt_duration.svg?raw";
  import img_fmt_financial from "./icon-imgs/format/icon_fmt_financial.svg?raw";
  import img_fmt_financial_active from "./icon-imgs/format/icon_fmt_financial_active.svg?raw";
  import img_fmt_number from "./icon-imgs/format/icon_fmt_number.svg?raw";
  import img_fmt_percentage from "./icon-imgs/format/icon_fmt_percentage.svg?raw";
  import img_fmt_scientific from "./icon-imgs/format/icon_fmt_scientific.svg?raw";
  import img_fmt_time from "./icon-imgs/format/icon_fmt_time.svg?raw";
  import img_num_fmt_other from "./icon-imgs/format/icon_num_fmt_other.svg?raw";
  import img_add_square from "./icon-imgs/icon_add_square.svg?raw";
  import img_alert_info from "./icon-imgs/icon_alert_info.svg?raw";
  import img_align_left from "./icon-imgs/icon_align_left.svg?raw";
  import img_align_center from "./icon-imgs/icon_align_center.svg?raw";
  import img_align_right from "./icon-imgs/icon_align_right.svg?raw";
  import img_align_top from "./icon-imgs/icon_align_top.svg?raw";
  import img_align_middle from "./icon-imgs/icon_align_middle.svg?raw";
  import img_align_bottom from "./icon-imgs/icon_align_bottom.svg?raw";
  import img_alternative_color from "./icon-imgs/icon_alternative_color.svg?raw";
  import img_arrow_dropdown from "./icon-imgs/icon_arrow_dropdown.svg?raw";
  import img_arrow_dropdown_active from "./icon-imgs/icon_arrow_dropdown_active.svg?raw";
  import img_arrow_dropdown_small from "./icon-imgs/icon_arrow_dropdown_small.svg?raw";
  import img_arrow_dropdown_small_active from "./icon-imgs/icon_arrow_dropdown_small_active.svg?raw";
  import img_arrow_right from "./icon-imgs/icon_arrow_right.svg?raw";
  import img_bold from "./icon-imgs/icon_bold.svg?raw";
  import img_toolbar_border from "./icon-imgs/icon_border_toolbar.svg?raw";
  import img_all_borders from "./icon-imgs/icon_border_all_borders.svg?raw";
  import img_inner_borders from "./icon-imgs/icon_border_inner_borders.svg?raw";
  import img_horizontal_borders from "./icon-imgs/icon_border_horizontal_borders.svg?raw";
  import img_vertical_borders from "./icon-imgs/icon_border_vertical_borders.svg?raw";
  import img_outer_borders from "./icon-imgs/icon_border_outer_borders.svg?raw";
  import img_left_border from "./icon-imgs/icon_border_left_border.svg?raw";
  import img_top_border from "./icon-imgs/icon_border_top_border.svg?raw";
  import img_right_border from "./icon-imgs/icon_border_right_border.svg?raw";
  import img_bottom_border from "./icon-imgs/icon_border_bottom_border.svg?raw";
  import img_clear_borders from "./icon-imgs/icon_border_clear_borders.svg?raw";
  import img_cell_style from "./icon-imgs/icon_cell_style.svg?raw";
  import img_chart from "./icon-imgs/icon_chart.svg?raw";
  import img_chat from "./icon-imgs/icon_chat.svg?raw";
  import img_chevron_1 from "./icon-imgs/icon_chevron_1.svg?raw";
  import img_collapsed_panel_horizontal_left from "./icon-imgs/icon_collapsed_panel_horizontal_left.svg?raw";
  import img_collapsed_panel_vertical_top from "./icon-imgs/icon_collapsed_panel_vertical_top.svg?raw";
  import img_conditional_formating from "./icon-imgs/icon_conditional_formating.svg?raw";
  import img_datadocs_logo from "./icon-imgs/icon_datadocs_logo.svg?raw";
  import img_datadocs_mobile_logo from "./icon-imgs/icon_datadocs_mobile_logo.svg?raw";
  import img_drag from "./icon-imgs/icon_drag.svg?raw";
  import img_filter from "./icon-imgs/icon_filter.svg?raw";
  import img_fullscreen from "./icon-imgs/icon_fullscreen.svg?raw";
  import img_group from "./icon-imgs/icon_group.svg?raw";
  import img_h_dots from "./icon-imgs/icon_h_dots.svg?raw";
  import img_h_grip from "./icon-imgs/icon_h_grip.svg?raw";
  // import img_status_grid from "./icon-imgs/icon_status_grid.svg?raw";
  // import img_status_book from "./icon-imgs/icon_status_book.svg?raw";
  // import img_status_text from "./icon-imgs/icon_status_text.svg?raw";
  import img_h_grip_single_line from "./icon-imgs/icon_h_grip_single.svg?raw";
  import img_h_grip_tiny from "./icon-imgs/icon_h_grip_tiny.svg?raw";
  import img_h_layout from "./icon-imgs/icon_h_layout.svg?raw";
  import img_italic from "./icon-imgs/icon_italic.svg?raw";
  import img_layers from "./icon-imgs/icon_layers.svg?raw";
  import img_merge_cell from "./icon-imgs/icon_merge_cell.svg?raw";
  import img_merge_all from "./icon-imgs/icon_merge_all.svg?raw";
  import img_merge_horizontal from "./icon-imgs/icon_merge_horizontal.svg?raw";
  import img_merge_vertical from "./icon-imgs/icon_merge_vertical.svg?raw";
  import img_merge_unmerge from "./icon-imgs/icon_merge_unmerge.svg?raw";
  import img_messages from "./icon-imgs/icon_messages.svg?raw";
  import img_num_fmt_currency from "./icon-imgs/icon_num_fmt_currency.svg?raw";
  import img_clear_cells from "./icon-imgs/icon_clear_cells.svg?raw";
  import img_delete_cells from "./icon-imgs/icon_delete_cells.svg?raw";
  import img_insert_cells from "./icon-imgs/icon_insert_cells.svg?raw";
  import img_num_fmt_decimal_decrease from "./icon-imgs/icon_num_fmt_decimal_decrease.svg?raw";
  import img_num_fmt_decimal_increase from "./icon-imgs/icon_num_fmt_decimal_increase.svg?raw";
  import img_num_fmt_percent from "./icon-imgs/icon_num_fmt_percent.svg?raw";
  import img_paint_format from "./icon-imgs/icon_paint_format.svg?raw";
  import img_panel_collapse from "./icon-imgs/icon_panel_collapse.svg?raw";
  import img_panel_settings from "./icon-imgs/icon_panel_settings.svg?raw";
  import img_pick_cell from "./icon-imgs/icon_pick_cell.svg?raw";
  import img_query_history from "./icon-imgs/icon_query_history.svg?raw";
  import img_read_more from "./icon-imgs/icon_read_more.svg?raw";
  import img_rects from "./icon-imgs/icon_rects.svg?raw";
  import img_sort from "./icon-imgs/icon_sort.svg?raw";
  import img_sort_add from "./icon-imgs/icon_sort_add.svg?raw";
  import img_sort_remove from "./icon-imgs/icon_sort_remove.svg?raw";
  import img_sources from "./icon-imgs/icon_sources.svg?raw";
  import img_sticky from "./icon-imgs/icon_sticky.svg?raw";
  import img_strikethrough from "./icon-imgs/icon_strikethrough.svg?raw";
  import img_underline from "./icon-imgs/icon_underline.svg?raw";
  import img_table_view from "./icon-imgs/icon_table_view.svg?raw";
  import img_text_rotation_angleup from "./icon-imgs/icon_text_rotation_angleup.svg?raw";
  import img_toolbar_more from "./icon-imgs/icon_toolbar_more.svg?raw";
  import img_v_grip from "./icon-imgs/icon_v_grip.svg?raw";
  import img_text_wrapping_overflow from "./icon-imgs/icon_text_wrapping_overflow.svg?raw";
  import img_text_wrapping_wrap from "./icon-imgs/icon_text_wrapping_wrap.svg?raw";
  import img_text_wrapping_clip from "./icon-imgs/icon_text_wrapping_clip.svg?raw";
  import img_query_editor_formula from "./icon-imgs/query-editor/icon_formula.svg?raw";
  import img_query_editor_application from "./icon-imgs/query-editor/icon_query_editor_application.svg?raw";
  import img_query_editor_arrow from "./icon-imgs/query-editor/icon_query_editor_arrow.svg?raw";
  import img_query_editor_http from "./icon-imgs/query-editor/icon_query_editor_http.svg?raw";
  import img_query_editor_raw from "./icon-imgs/query-editor/icon_query_editor_raw.svg?raw";
  import img_status_bar_add_tab from "./icon-imgs/status-bar/icon_status_bar_add_tab.svg?raw";
  import img_status_bar_arrow_left from "./icon-imgs/status-bar/icon_status_bar_arrow_left.svg?raw";
  import img_status_bar_arrow_right from "./icon-imgs/status-bar/icon_status_bar_arrow_right.svg?raw";
  import img_status_bar_dashboard from "./icon-imgs/status-bar/icon_status_bar_dashboard.svg?raw";
  import img_status_bar_document from "./icon-imgs/status-bar/icon_status_bar_document.svg?raw";
  import img_status_bar_grid from "./icon-imgs/status-bar/icon_status_bar_grid.svg?raw";
  import img_status_bar_row_horizontal from "./icon-imgs/status-bar/icon_status_bar_row_horizontal.svg?raw";
  import img_status_bar_sheet from "./icon-imgs/status-bar/icon_status_bar_sheet.svg?raw";
  import img_status_bar_blank_canvas from "./icon-imgs/status-bar/context-menu/icon-status-bar-blank-canvas.svg?raw";
  import img_status_bar_graph from "./icon-imgs/status-bar/context-menu/icon-status-bar-graph.svg?raw";
  import img_status_bar_spreadsheet from "./icon-imgs/status-bar/context-menu/icon-status-bar-spreadsheet.svg?raw";
  import img_status_bar_more from "./icon-imgs/status-bar/icon_status_bar_more.svg?raw";
  import img_toolbar_add_custom_color from "./icon-imgs/toolbar/icon_toolbar_add_custom_color.svg?raw";
  import img_toolbar_arrow_dropdown from "./icon-imgs/toolbar/icon_toolbar_arrow_dropdown.svg?raw";
  import img_toolbar_opacity_lock from "./icon-imgs/toolbar/icon_toolbar_opacity_lock.svg?raw";
  import img_toolbar_opacity_unlock from "./icon-imgs/toolbar/icon_toolbar_opacity_unlock.svg?raw";
  import img_export from "./icon-imgs/top-menu/icon_export.svg?raw";
  import img_share from "./icon-imgs/top-menu/icon_share.svg?raw";
  import img_top_menu_item_tick from "./icon-imgs/top-menu/icon_top_menu_item_tick.svg?raw";
  import img_top_submenu_arrow from "./icon-imgs/top-menu/icon_top_submenu_arrow.svg?raw";
  import img_workbook_header from "./icon-imgs/top-menu/icon_workbook_header.svg?raw";
  import img_top_menu_view_create_workspace from "./icon-imgs/top-menu/view-menu/icon_top_menu_view_create_workspace.svg?raw";
  import img_top_menu_view_delete_workspace from "./icon-imgs/top-menu/view-menu/icon_top_menu_view_delete_workspace.svg?raw";
  import img_top_menu_view_freeze from "./icon-imgs/top-menu/view-menu/icon_top_menu_view_freeze.svg?raw";
  import img_top_menu_view_full_screen from "./icon-imgs/top-menu/view-menu/icon_top_menu_view_full_screen.svg?raw";
  import img_top_menu_view_test_query from "./icon-imgs/top-menu/view-menu/icon_top_menu_view_test_query.svg?raw";
  import img_top_menu_view_group from "./icon-imgs/top-menu/view-menu/icon_top_menu_view_group.svg?raw";
  import img_top_menu_view_hidden_sheets from "./icon-imgs/top-menu/view-menu/icon_top_menu_view_hidden_sheets.svg?raw";
  import img_top_menu_view_panels from "./icon-imgs/top-menu/view-menu/icon_top_menu_view_panels.svg?raw";
  import img_top_menu_view_reset from "./icon-imgs/top-menu/view-menu/icon_top_menu_view_reset.svg?raw";
  import img_top_menu_view_show from "./icon-imgs/top-menu/view-menu/icon_top_menu_view_show.svg?raw";
  import img_top_menu_view_workspace from "./icon-imgs/top-menu/view-menu/icon_top_menu_view_workspace.svg?raw";
  import img_top_menu_view_zoom from "./icon-imgs/top-menu/view-menu/icon_top_menu_view_zoom.svg?raw";
  import img_empty_rect from "./icon-imgs/top-menu/icon_empty_rect.svg?raw";
  import img_workspace_modal_close from "./icon-imgs/top-menu/view-menu/icon_workspace_modal_close.svg?raw";
  import img_workspace_modal_delete from "./icon-imgs/top-menu/view-menu/icon_workspace_modal_delete.svg?raw";
  import img_input_form_error from "./icon-imgs/form/icon_input_form_error.svg?raw";
  import img_input_decrement from "./icon-imgs/form/icon_input_decrement.svg?raw";
  import img_input_increment from "./icon-imgs/form/icon_input_increment.svg?raw";
  import img_calendar_pick from "./icon-imgs/icon_calendar_pick.svg?raw";
  import img_home from "./icon-imgs/icon_home.svg?raw";
  import img_search from "./icon-imgs/icon_search.svg?raw";
  import img_plus_sign from "./icon-imgs/icon_plus_sign.svg?raw";
  import img_location from "./icon-imgs/icon_location.svg?raw";
  import img_tw_database from "./icon-imgs/tree-view/icon_tw_database.svg?raw";
  import img_tw_database_folder from "./icon-imgs/tree-view/icon_tw_database_folder.svg?raw";
  import img_tw_database_active from "./icon-imgs/tree-view/icon_tw_database_active.svg?raw";
  import img_tw_database_inactive from "./icon-imgs/tree-view/icon_tw_database_inactive.svg?raw";
  import img_tw_database_empty from "./icon-imgs/tree-view/icon_tw_database_empty.svg?raw";
  import img_tw_dbschema from "./icon-imgs/tree-view/icon_tw_dbschema.svg?raw";
  import img_tw_dbtable from "./icon-imgs/tree-view/icon_tw_dbtable.svg?raw";
  import img_tw_expand_arrow from "./icon-imgs/tree-view/icon_tw_expand_arrow.svg?raw";
  import img_tw_column_binary from "./icon-imgs/tree-view/icon_tw_column_binary.svg?raw";
  import img_tw_column_boolean from "./icon-imgs/tree-view/icon_tw_column_boolean.svg?raw";
  import img_tw_column_date from "./icon-imgs/tree-view/icon_tw_column_date.svg?raw";
  import img_tw_column_datetime_arr from "./icon-imgs/tree-view/icon_tw_column_datetime_arr.svg?raw";
  import img_tw_column_decimal from "./icon-imgs/tree-view/icon_tw_column_decimal.svg?raw";
  import img_tw_column_json from "./icon-imgs/tree-view/icon_tw_column_json.svg?raw";
  import img_tw_column_location from "./icon-imgs/tree-view/icon_tw_column_location.svg?raw";
  import img_tw_column_number_arr from "./icon-imgs/tree-view/icon_tw_column_number_arr.svg?raw";
  import img_tw_column_number from "./icon-imgs/tree-view/icon_tw_column_number.svg?raw";
  import img_tw_column_string_arr from "./icon-imgs/tree-view/icon_tw_column_string_arr.svg?raw";
  import img_tw_column_string from "./icon-imgs/tree-view/icon_tw_column_string.svg?raw";
  import img_tw_column_time from "./icon-imgs/tree-view/icon_tw_column_time.svg?raw";
  import img_tw_fsexcel from "./icon-imgs/tree-view/icon_tw_fsexcel.svg?raw";
  import img_tw_fscsv from "./icon-imgs/tree-view/icon_tw_fscsv.svg?raw";
  import img_tw_fssheet from "./icon-imgs/tree-view/icon_tw_fssheet.svg?raw";
  import img_tw_source_csv from "./icon-imgs/tree-view/icon_tw_source_csv.svg?raw";
  import img_tw_source_csv_disabled from "./icon-imgs/tree-view/icon_tw_source_csv_disabled.svg?raw";
  import img_tw_source_excel from "./icon-imgs/tree-view/icon_tw_source_excel.svg?raw";
  import img_input_password_invisible from "./icon-imgs/icon_input_password_invisible.svg?raw";
  import img_input_password_visible from "./icon-imgs/icon_input_password_visible.svg?raw";
  import img_navigate_left from "./icon-imgs/icon_navigate_left.svg?raw";
  import img_navigate_right from "./icon-imgs/icon_navigate_right.svg?raw";
  import img_table_column_style from "./icon-imgs/icon_table_column_style.svg?raw";
  import img_table_summary_collapse from "./icon-imgs/icon_table_summary_collapse.svg?raw";
  import img_table_summary_expand from "./icon-imgs/icon_table_summary_expand.svg?raw";
  import img_table_row_style from "./icon-imgs/icon_table_row_style.svg?raw";

  import img_object_container from "./icon-imgs/panel-objects/object-container.svg?raw";
  import img_object_container_tiled from "./icon-imgs/panel-objects/object-container-tiled.svg?raw";
  import img_object_chart from "./icon-imgs/panel-objects/object-chart.svg?raw";
  import img_object_image from "./icon-imgs/panel-objects/object-image.svg?raw";
  import img_object_spreadsheet from "./icon-imgs/panel-objects/object-spreadsheet.svg?raw";

  // import img_layer_item_grid from "./icon-imgs/panel-layers/layer-item-grid.svg?raw";
  // import img_layer_item_image from "./icon-imgs/panel-layers/layer-item-image.svg?raw";
  // import img_layer_item_slicer from "./icon-imgs/panel-layers/layer-item-slicer.svg?raw";
  // import img_layer_item_chart_bar from "./icon-imgs/panel-layers/layer-item-bar-chart.svg?raw";
  // import img_layer_item_chart_pie from "./icon-imgs/panel-layers/layer-item-pie-chart.svg?raw";
  import img_layer_item_container from "./icon-imgs/panel-layers/layer-item-container.svg?raw";
  import img_layer_item_chart from "./icon-imgs/panel-layers/layer-item-chart.svg?raw";
  import img_layer_item_spreadsheet from "./icon-imgs/panel-layers/layer-item-spreadsheet.svg?raw";
  import img_layer_item_image from "./icon-imgs/panel-layers/layer-item-image.svg?raw";
  import img_layer_action_group_arrow from "./icon-imgs/panel-layers/layer-action-group-arrow.svg?raw";
  import img_layer_action_toggle from "./icon-imgs/panel-layers/layer-action-toggle.svg?raw";
  import img_layer_action_lock from "./icon-imgs/panel-layers/layer-action-lock.svg?raw";
  import img_layer_action_delete from "./icon-imgs/panel-layers/layer-action-delete.svg?raw";
  import img_layers_grid from "./icon-imgs/panel-layers/layers-grid.svg?raw";
  import img_layers_label_arrow from "./icon-imgs/panel-layers/layers-label-arrow.svg?raw";
  import img_layers_filters from "./icon-imgs/panel-layers/layers-filter-add.svg?raw";
  import img_layers_expand_collapse from "./icon-imgs/panel-layers/layers-expand-collpase.svg?raw";
  import img_layers_folder from "./icon-imgs/panel-layers/layers-folder-open.svg?raw";

  import img_sticky_medium from "./icon-imgs/icon_sticky_medium.svg?raw";
  import img_settings_medium from "./icon-imgs/icon_settings_medium.svg?raw";

  import img_3_arrows_colored_up from "./icon-imgs/conditional-formatting/3-arrows-colored/arrow-up.svg?raw";
  import img_3_arrows_colored_right from "./icon-imgs/conditional-formatting/3-arrows-colored/arrow-right.svg?raw";
  import img_3_arrows_colored_down from "./icon-imgs/conditional-formatting/3-arrows-colored/arrow-down.svg?raw";
  import img_3_traffic_lights_green from "./icon-imgs/conditional-formatting/3-traffic-lights/green-light.svg?raw";
  import img_3_traffic_lights_yellow from "./icon-imgs/conditional-formatting/3-traffic-lights/yellow-light.svg?raw";
  import img_3_traffic_lights_red from "./icon-imgs/conditional-formatting/3-traffic-lights/red-light.svg?raw";

  import img_filter_add from "./icon-imgs/icon_filter_add.svg?raw";
  import img_filter_add_advanced from "./icon-imgs/filter/icon_filter_add_advanced.svg?raw";
  import img_filter_by_color from "./icon-imgs/filter/icon_filter_by_color.svg?raw";
  import img_filter_clear from "./icon-imgs/filter/icon_filter_clear.svg?raw";
  import img_filter_state_enable from "./icon-imgs/filter/icon_filter_state_enable.svg?raw";
  import img_filter_state_disable from "./icon-imgs/filter/icon_filter_state_disable.svg?raw";
  import img_filter_group_collapse from "./icon-imgs/filter/icon_filter_group_collapse.svg?raw";
  import img_filter_group_collapsed from "./icon-imgs/filter/icon_filter_group_collapsed.svg?raw";
  import img_filter_group_expand from "./icon-imgs/filter/icon_filter_group_expand.svg?raw";
  import img_filter_delete from "./icon-imgs/filter/icon_filter_delete.svg?raw";
  import img_filter_search from "./icon-imgs/filter/icon_filter_search.svg?raw";
  import img_filter_settings from "./icon-imgs/filter/icon_filter_settings.svg?raw";

  import img_sort_by_color from "./icon-imgs/filter/icon_sort_by_color.svg?raw";
  import img_sort_text_ascending from "./icon-imgs/filter/icon_sort_text_ascending.svg?raw";
  import img_sort_text_descending from "./icon-imgs/filter/icon_sort_text_descending.svg?raw";
  import img_sort_tick_sign from "./icon-imgs/filter/icon_sort_tick_sign.svg?raw";

  // data type
  import img_data_type_array_array from "./icon-imgs/data-type/icon_data_type_array_array.svg?raw";
  import img_data_type_array_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_array_array.svg?raw";
  import img_data_type_binary from "./icon-imgs/data-type/icon_data_type_binary.svg?raw";
  import img_data_type_binary_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_binary.svg?raw";
  import img_data_type_binary_array from "./icon-imgs/data-type/icon_data_type_binary_array.svg?raw";
  import img_data_type_binary_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_binary_array.svg?raw";
  import img_data_type_boolean from "./icon-imgs/data-type/icon_data_type_boolean.svg?raw";
  import img_data_type_boolean_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_boolean.svg?raw";
  import img_data_type_boolean_array from "./icon-imgs/data-type/icon_data_type_boolean_array.svg?raw";
  import img_data_type_boolean_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_boolean_array.svg?raw";
  import img_data_type_date from "./icon-imgs/data-type/icon_data_type_date.svg?raw";
  import img_data_type_date_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_date.svg?raw";
  import img_data_type_date_array from "./icon-imgs/data-type/icon_data_type_date_array.svg?raw";
  import img_data_type_date_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_date_array.svg?raw";
  import img_data_type_datetime from "./icon-imgs/data-type/icon_data_type_datetime.svg?raw";
  import img_data_type_datetime_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_datetime.svg?raw";
  import img_data_type_datetime_array from "./icon-imgs/data-type/icon_data_type_datetime_array.svg?raw";
  import img_data_type_datetime_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_datetime_array.svg?raw";
  import img_data_type_decimal from "./icon-imgs/data-type/icon_data_type_decimal.svg?raw";
  import img_data_type_decimal_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_decimal.svg?raw";
  import img_data_type_decimal_array from "./icon-imgs/data-type/icon_data_type_decimal_array.svg?raw";
  import img_data_type_decimal_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_decimal_array.svg?raw";
  import img_data_type_float from "./icon-imgs/data-type/icon_data_type_float.svg?raw";
  import img_data_type_float_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_float.svg?raw";
  import img_data_type_float_array from "./icon-imgs/data-type/icon_data_type_float_array.svg?raw";
  import img_data_type_float_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_float_array.svg?raw";
  import img_data_type_geography from "./icon-imgs/data-type/icon_data_type_geography.svg?raw";
  import img_data_type_geography_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_geography.svg?raw";
  import img_data_type_geography_array from "./icon-imgs/data-type/icon_data_type_geography_array.svg?raw";
  import img_data_type_geography_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_geography_array.svg?raw";
  import img_data_type_integer from "./icon-imgs/data-type/icon_data_type_integer.svg?raw";
  import img_data_type_integer_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_integer.svg?raw";
  import img_data_type_integer_array from "./icon-imgs/data-type/icon_data_type_integer_array.svg?raw";
  import img_data_type_integer_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_integer_array.svg?raw";
  import img_data_type_interval from "./icon-imgs/data-type/icon_data_type_interval.svg?raw";
  import img_data_type_interval_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_interval.svg?raw";
  import img_data_type_interval_array from "./icon-imgs/data-type/icon_data_type_interval_array.svg?raw";
  import img_data_type_interval_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_interval_array.svg?raw";
  import img_data_type_json_array from "./icon-imgs/data-type/icon_data_type_json_array.svg?raw";
  import img_data_type_json_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_json_array.svg?raw";
  import img_data_type_json from "./icon-imgs/data-type/icon_data_type_json.svg?raw";
  import img_data_type_json_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_json.svg?raw";
  import img_data_type_string from "./icon-imgs/data-type/icon_data_type_string.svg?raw";
  import img_data_type_string_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_string.svg?raw";
  import img_data_type_string_array from "./icon-imgs/data-type/icon_data_type_string_array.svg?raw";
  import img_data_type_string_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_string_array.svg?raw";
  import img_data_type_struct from "./icon-imgs/data-type/icon_data_type_struct.svg?raw";
  import img_data_type_struct_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_struct.svg?raw";
  import img_data_type_struct_array from "./icon-imgs/data-type/icon_data_type_struct_array.svg?raw";
  import img_data_type_struct_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_struct_array.svg?raw";
  import img_data_type_time from "./icon-imgs/data-type/icon_data_type_time.svg?raw";
  import img_data_type_time_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_time.svg?raw";
  import img_data_type_time_array from "./icon-imgs/data-type/icon_data_type_time_array.svg?raw";
  import img_data_type_time_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_time_array.svg?raw";
  import img_data_type_timestamp from "./icon-imgs/data-type/icon_data_type_timestamp.svg?raw";
  import img_data_type_timestamp_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_timestamp.svg?raw";
  import img_data_type_timestamp_array from "./icon-imgs/data-type/icon_data_type_timestamp_array.svg?raw";
  import img_data_type_timestamp_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_timestamp_array.svg?raw";
  import img_data_type_variant from "./icon-imgs/data-type/icon_data_type_variant.svg?raw";
  import img_data_type_variant_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_variant.svg?raw";
  import img_data_type_variant_array from "./icon-imgs/data-type/icon_data_type_variant_array.svg?raw";
  import img_data_type_variant_array_grayscale from "./icon-imgs/data-type/grayscale/icon_data_type_variant_array.svg?raw";

  // image dropdown
  import img_dropdown_resize from "./icon-imgs/dropdown/icon_dropdown_resize.svg?raw";

  // image toolbar
  import img_toolbar_image_align_bottom from "./icon-imgs/toolbar/toolbar-image/align-bottom.svg?raw";
  import img_toolbar_image_align_left from "./icon-imgs/toolbar/toolbar-image/align-left.svg?raw";
  import img_toolbar_image_filter from "./icon-imgs/toolbar/toolbar-image/filter.svg?raw";
  import img_toolbar_image_rotate from "./icon-imgs/toolbar/toolbar-image/rotate.svg?raw";

  // currency format
  import img_currency_format_dollar from "./icon-imgs/currency-format/dollar.svg?raw";
  import img_currency_format_euro from "./icon-imgs/currency-format/euro.svg?raw";
  import img_currency_format_pound from "./icon-imgs/currency-format/pound.svg?raw";

  import img_map_layers from "./icon-imgs/map/icon_map_layers.svg?raw";
  import img_map_locate from "./icon-imgs/map/icon_map_locate.svg?raw";
  import img_map_marker_handle from "./icon-imgs/map/icon_map_marker_handle.svg?raw";
  import img_map_zoom_in from "./icon-imgs/map/icon_map_zoom_in.svg?raw";
  import img_map_zoom_out from "./icon-imgs/map/icon_map_zoom_out.svg?raw";

  // text rotation style
  import img_text_rotation_none from "./icon-imgs/icon_text_rotation_none.svg?raw";
  import img_text_rotation_rotate_down from "./icon-imgs/icon_text_rotation_rotate_down.svg?raw";
  import img_text_rotation_rotate_up from "./icon-imgs/icon_text_rotation_rotate_up.svg?raw";
  import img_text_rotation_stack_vertically from "./icon-imgs/icon_text_rotation_stack_vertically.svg?raw";
  import img_text_rotation_tilt_down from "./icon-imgs/icon_text_rotation_tilt_down.svg?raw";
  import img_text_rotation_tilt_up from "./icon-imgs/icon_text_rotation_tilt_up.svg?raw";

  // Hyperlink menu
  import img_hyperlink from "./icon-imgs/hyperlink/icon_hyperlink.svg?raw";
  import img_hyperlink_edit from "./icon-imgs/hyperlink/icon_hyperlink_edit.svg?raw";
  import img_hyperlink_remove from "./icon-imgs/hyperlink/icon_hyperlink_remove.svg?raw";
  import img_hyperlink_favicon from "./icon-imgs/hyperlink/icon_hyperlink_favicon.svg?raw";

  // Datadocs panel
  import img_panel_add_folder from "./icon-imgs/panel-dd-sources/icon_add_folder.svg?raw";
  import img_panel_file from "./icon-imgs/panel-dd-sources/icon_file.svg?raw";
  import img_panel_folder from "./icon-imgs/panel-dd-sources/icon_folder.svg?raw";
  import img_panel_sort from "./icon-imgs/panel-dd-sources/icon_sort.svg?raw";
  import img_panel_more from "./icon-imgs/panel-dd-sources/icon_more.svg?raw";
  import img_panel_search from "./icon-imgs/panel-dd-sources/icon_search.svg?raw";
  import img_panel_search_clear from "./icon-imgs/panel-dd-sources/icon_search_clear.svg?raw";
  import img_panel_breadcrumb_separator from "./icon-imgs/panel-dd-sources/icon_breadcrumb_separator.svg?raw";
  import img_panel_breadcrumb_slash_separator from "./icon-imgs/panel-dd-sources/icon_breadcrumb_slash_separator.svg?raw";
  import img_panel_breadcrumb_home from "./icon-imgs/panel-dd-sources/icon_breadcrumb_home.svg?raw";
  import img_panel_breadcrumb_back from "./icon-imgs/panel-dd-sources/icon_breadcrumb_back.svg?raw";
  import img_panel_breadcrumb_expand from "./icon-imgs/panel-dd-sources/icon_breadcrumb_expand.svg?raw";

  // Key icons
  import img_key_c from "./icon-imgs/keys/icon_key_c.svg?raw";
  import img_key_cmd from "./icon-imgs/keys/icon_key_cmd.svg?raw";
  import img_key_shift from "./icon-imgs/keys/icon_key_shift.svg?raw";
  import img_key_v from "./icon-imgs/keys/icon_key_v.svg?raw";
  import img_key_x from "./icon-imgs/keys/icon_key_x.svg?raw";
  import img_key_z from "./icon-imgs/keys/icon_key_z.svg?raw";

  // Insert menu (top menu)
  import img_top_menu_insert_cells from "./icon-imgs/top-menu/insert-menu/icon_insert_cells.svg?raw";
  import img_top_menu_insert_columns from "./icon-imgs/top-menu/insert-menu/icon_insert_columns.svg?raw";
  import img_top_menu_insert_hyperlink from "./icon-imgs/top-menu/insert-menu/icon_insert_hyperlink.svg?raw";
  import img_top_menu_insert_rows from "./icon-imgs/top-menu/insert-menu/icon_insert_rows.svg?raw";
  import img_top_menu_insert_sheet from "./icon-imgs/top-menu/insert-menu/icon_insert_sheet.svg?raw";

  // Arrange menu (top menu)
  import img_top_menu_arrange_datadocs from "./icon-imgs/top-menu/arrange-menu/icon_arrange_datadocs.svg?raw";
  import img_top_menu_arrange_sources from "./icon-imgs/top-menu/arrange-menu/icon_arrange_sources.svg?raw";
  import img_top_menu_arrange_table from "./icon-imgs/top-menu/arrange-menu/icon_arrange_table.svg?raw";
  import img_top_menu_arrange_workspace from "./icon-imgs/top-menu/arrange-menu/icon_arrange_workspace.svg?raw";
  // Sources panel
  import img_panel_close from "./icon-imgs/panel-sources/icon_detail_close.svg?raw";
  import img_panel_uitable from "./icon-imgs/panel-sources/icon_detail_uitable.svg?raw";
  import img_panel_dbtable from "./icon-imgs/panel-sources/icon_detail_dbtable.svg?raw";
  import img_panel_remote_fs_manager_active from "./icon-imgs/panel-sources/icon_remote_fs_manager_active.svg?raw";
  import img_panel_remote_fs_manager_inactive from "./icon-imgs/panel-sources/icon_remote_fs_manager_inactive.svg?raw";
  import img_panel_toolbar_connect_database from "./icon-imgs/panel-sources/icon_toolbar_connect_database.svg?raw";
  import img_panel_toolbar_connect_server from "./icon-imgs/panel-sources/icon_toolbar_connect_server.svg?raw";
  import img_panel_toolbar_upload_files from "./icon-imgs/panel-sources/icon_toolbar_upload_files.svg?raw";
  import img_panel_edit_database from "./icon-imgs/panel-sources/icon_edit_database.svg?raw";
  import img_icon_reload from "./icon-imgs/panel-sources/icon_reload.svg?raw";

  // Edit menu
  import img_undo from "./icon-imgs/icon_undo.svg?raw";
  import img_redo from "./icon-imgs/icon_redo.svg?raw";
  import img_cut from "./icon-imgs/icon_cut.svg?raw";
  import img_copy from "./icon-imgs/icon_copy.svg?raw";
  import img_paste from "./icon-imgs/icon_paste.svg?raw";
  import img_clear from "./icon-imgs/icon_clear.svg?raw";
  import img_delete from "./icon-imgs/icon_trash_can.svg?raw";

  // view menu
  import img_new_datadocs from "./icon-imgs/icon_new_datadocs.svg?raw";
  import img_open_datadocs from "./icon-imgs/icon_open_datadocs.svg?raw";
  import img_import from "./icon-imgs/icon_import.svg?raw";

  export let icon = "";
  export let data = "";

  export let size = "12px";
  export let width = size;
  export let height = size;
  export let color = "currentColor";
  export let stroke = "transparent";
  export let fill = color;

  let className = "";
  export { className as class };

  export let svg = null;

  let viewBox = "";

  function extractViewBox(svg) {
    const regex = /viewBox="([\d\.\- ]+)"/;
    const res = regex.exec(svg);
    if (!res) return `0 0 12 12`; // default value
    return res[1];
  }

  $: {
    switch (icon) {
      case "datadocs-logo": {
        data = img_datadocs_logo;
        break;
      }
      case "datadocs-mobile-logo": {
        data = img_datadocs_mobile_logo;
        break;
      }
      case "sources": {
        data = img_sources;
        break;
      }
      case "chat": {
        data = img_chat;
        break;
      }
      case "fullscreen": {
        data = img_fullscreen;
        break;
      }
      case "group": {
        data = img_group;
        break;
      }
      case "h-dots": {
        data = img_h_dots;
        break;
      }
      case "rects": {
        data = img_rects;
        break;
      }
      case "sticky": {
        data = img_sticky;
        break;
      }
      case "v-grip": {
        data = img_v_grip;
        break;
      }
      case "chevron-1": {
        data = img_chevron_1;
        break;
      }
      case "undo": {
        data = img_undo;
        break;
      }
      case "redo": {
        data = img_redo;
        break;
      }
      case "paint-format": {
        data = img_paint_format;
        break;
      }
      case "num-fmt-other": {
        data = img_num_fmt_other;
        break;
      }
      case "fmt-automatic": {
        data = img_fmt_automatic;
        break;
      }
      case "fmt-number": {
        data = img_fmt_number;
        break;
      }
      case "fmt-percentage": {
        data = img_fmt_percentage;
        break;
      }
      case "fmt-scientific": {
        data = img_fmt_scientific;
        break;
      }
      case "fmt-accounting": {
        data = img_fmt_accounting;
        break;
      }
      case "fmt-accounting-active": {
        data = img_fmt_accounting_active;
        break;
      }
      case "fmt-financial": {
        data = img_fmt_financial;
        break;
      }
      case "fmt-financial-active": {
        data = img_fmt_financial_active;
        break;
      }
      case "fmt-currency": {
        data = img_fmt_currency;
        break;
      }
      case "fmt-currency-rounded": {
        data = img_fmt_currency_rounded;
        break;
      }
      case "fmt-date": {
        data = img_fmt_date;
        break;
      }
      case "fmt-time": {
        data = img_fmt_time;
        break;
      }
      case "fmt-date-time": {
        data = img_fmt_date_time;
        break;
      }
      case "fmt-duration": {
        data = img_fmt_duration;
        break;
      }
      case "num-fmt-currency": {
        data = img_num_fmt_currency;
        break;
      }
      case "num-fmt-percent": {
        data = img_num_fmt_percent;
        break;
      }
      case "num-fmt-decimal-decrease": {
        data = img_num_fmt_decimal_decrease;
        break;
      }
      case "num-fmt-decimal-increase": {
        data = img_num_fmt_decimal_increase;
        break;
      }
      case "bold": {
        data = img_bold;
        break;
      }
      case "italic": {
        data = img_italic;
        break;
      }
      case "strikethrough": {
        data = img_strikethrough;
        break;
      }
      case "underline": {
        data = img_underline;
        break;
      }
      case "conditional-formating": {
        data = img_conditional_formating;
        break;
      }
      case "alternative-color": {
        data = img_alternative_color;
        break;
      }
      case "cell-style": {
        data = img_cell_style;
        break;
      }
      case "toolbar-border": {
        data = img_toolbar_border;
        break;
      }
      case "all-borders": {
        data = img_all_borders;
        break;
      }
      case "inner-borders": {
        data = img_inner_borders;
        break;
      }
      case "horizontal-borders": {
        data = img_horizontal_borders;
        break;
      }
      case "vertical-borders": {
        data = img_vertical_borders;
        break;
      }
      case "outer-borders": {
        data = img_outer_borders;
        break;
      }
      case "left-border": {
        data = img_left_border;
        break;
      }
      case "top-border": {
        data = img_top_border;
        break;
      }
      case "right-border": {
        data = img_right_border;
        break;
      }
      case "bottom-border": {
        data = img_bottom_border;
        break;
      }
      case "clear-borders": {
        data = img_clear_borders;
        break;
      }
      case "merge-cell": {
        data = img_merge_cell;
        break;
      }
      case "merge-all": {
        data = img_merge_all;
        break;
      }
      case "merge-horizontal": {
        data = img_merge_horizontal;
        break;
      }
      case "merge-vertical": {
        data = img_merge_vertical;
        break;
      }
      case "merge-unmerge": {
        data = img_merge_unmerge;
        break;
      }
      case "align-left": {
        data = img_align_left;
        break;
      }
      case "align-center": {
        data = img_align_center;
        break;
      }
      case "align-right": {
        data = img_align_right;
        break;
      }
      case "align-top": {
        data = img_align_top;
        break;
      }
      case "align-middle": {
        data = img_align_middle;
        break;
      }
      case "align-bottom": {
        data = img_align_bottom;
        break;
      }
      case "text-wrapping-overflow": {
        data = img_text_wrapping_overflow;
        break;
      }
      case "text-wrapping-wrap": {
        data = img_text_wrapping_wrap;
        break;
      }
      case "text-wrapping-clip": {
        data = img_text_wrapping_clip;
        break;
      }
      case "chart": {
        data = img_chart;
        break;
      }
      case "add-square": {
        data = img_add_square;
        break;
      }
      case "alert-info": {
        data = img_alert_info;
        break;
      }
      case "messages": {
        data = img_messages;
        break;
      }
      case "filter": {
        data = img_filter;
        break;
      }
      case "insert-cells": {
        data = img_insert_cells;
        break;
      }
      case "delete-cells": {
        data = img_delete_cells;
        break;
      }
      case "clear-cells": {
        data = img_clear_cells;
        break;
      }
      case "toolbar-more": {
        data = img_toolbar_more;
        break;
      }
      case "arrow-dropdown": {
        data = img_arrow_dropdown;
        break;
      }
      case "arrow-dropdown-active": {
        data = img_arrow_dropdown_active;
        break;
      }
      case "arrow-dropdown-small": {
        data = img_arrow_dropdown_small;
        break;
      }
      case "arrow-dropdown-small-active": {
        data = img_arrow_dropdown_small_active;
        break;
      }
      case "arrow-right": {
        data = img_arrow_right;
        break;
      }
      case "h-grip": {
        data = img_h_grip;
        break;
      }
      case "h-grip-tiny": {
        data = img_h_grip_tiny;
        break;
      }
      case "h-layout": {
        data = img_h_layout;
        break;
      }
      case "layers": {
        data = img_layers;
        break;
      }
      case "table-view": {
        data = img_table_view;
        break;
      }
      case "query-history": {
        data = img_query_history;
        break;
      }
      case "read-more": {
        data = img_read_more;
        break;
      }
      /*
      case "status-grid": {
        data = img_status_grid;
        break;
      }
      case "status-book": {
        data = img_status_book;
        break;
      }
      case "status-text": {
        data = img_status_text;
        break;
      }
      */
      case "h-grip-single": {
        data = img_h_grip_single_line;
        break;
      }
      case "workbook-header": {
        data = img_workbook_header;
        break;
      }
      case "export": {
        data = img_export;
        break;
      }
      case "share": {
        data = img_share;
        break;
      }
      case "toolbar-add-custom-color": {
        data = img_toolbar_add_custom_color;
        break;
      }
      case "toolbar-arrow-dropdown": {
        data = img_toolbar_arrow_dropdown;
        break;
      }
      case "toolbar-opacity-lock": {
        data = img_toolbar_opacity_lock;
        break;
      }
      case "toolbar-opacity-unlock": {
        data = img_toolbar_opacity_unlock;
        break;
      }

      // top menu
      case "top-submenu-arrow": {
        data = img_top_submenu_arrow;
        break;
      }
      case "top-menu-item-tick": {
        data = img_top_menu_item_tick;
        break;
      }
      case "top-menu-view-show": {
        data = img_top_menu_view_show;
        break;
      }
      case "top-menu-view-freeze": {
        data = img_top_menu_view_freeze;
        break;
      }
      case "top-menu-view-group": {
        data = img_top_menu_view_group;
        break;
      }
      case "top-menu-view-hidden-sheets": {
        data = img_top_menu_view_hidden_sheets;
        break;
      }
      case "top-menu-view-panels": {
        data = img_top_menu_view_panels;
        break;
      }
      case "top-menu-view-zoom": {
        data = img_top_menu_view_zoom;
        break;
      }
      case "top-menu-view-full-screen": {
        data = img_top_menu_view_full_screen;
        break;
      }
      case "top-menu-view-test-query": {
        data = img_top_menu_view_test_query;
        break;
      }
      case "top-menu-view-workspace": {
        data = img_top_menu_view_workspace;
        break;
      }
      case "top-menu-view-create-workspace": {
        data = img_top_menu_view_create_workspace;
        break;
      }
      case "top-menu-view-delete-workspace": {
        data = img_top_menu_view_delete_workspace;
        break;
      }
      case "top-menu-view-reset": {
        data = img_top_menu_view_reset;
        break;
      }
      // top menu -> insert menu
      case "menu-insert-cells": {
        data = img_top_menu_insert_cells;
        break;
      }
      case "menu-insert-columns": {
        data = img_top_menu_insert_columns;
        break;
      }
      case "menu-insert-hyperlink": {
        data = img_top_menu_insert_hyperlink;
        break;
      }
      case "menu-insert-rows": {
        data = img_top_menu_insert_rows;
        break;
      }
      case "menu-insert-sheet": {
        data = img_top_menu_insert_sheet;
        break;
      }
      // top menu -> arrange menu
      case "menu-arrange-datadocs": {
        data = img_top_menu_arrange_datadocs;
        break;
      }
      case "menu-arrange-sources": {
        data = img_top_menu_arrange_sources;
        break;
      }
      case "menu-arrange-table": {
        data = img_top_menu_arrange_table;
        break;
      }
      case "menu-arrange-workspace": {
        data = img_top_menu_arrange_workspace;
        break;
      }

      case "empty-rect": {
        data = img_empty_rect;
        break;
      }
      case "workspace-modal-close": {
        data = img_workspace_modal_close;
        break;
      }
      case "workspace-modal-delete": {
        data = img_workspace_modal_delete;
        break;
      }
      case "drag": {
        data = img_drag;
        break;
      }
      case "input-form-error": {
        data = img_input_form_error;
        break;
      }
      case "input-decrement": {
        data = img_input_decrement;
        break;
      }
      case "input-increment": {
        data = img_input_increment;
        break;
      }
      case "panel-collapse": {
        data = img_panel_collapse;
        break;
      }
      case "panel-settings": {
        data = img_panel_settings;
        break;
      }
      case "pick-cell": {
        data = img_pick_cell;
        break;
      }
      case "sort": {
        data = img_sort;
        break;
      }
      case "sort-add": {
        data = img_sort_add;
        break;
      }
      case "sort-remove": {
        data = img_sort_remove;
        break;
      }
      case "collapsed-panel-vertical-top": {
        data = img_collapsed_panel_vertical_top;
        break;
      }
      case "collapsed-panel-horizontal-left": {
        data = img_collapsed_panel_horizontal_left;
        break;
      }
      case "query-editor-arrow": {
        data = img_query_editor_arrow;
        break;
      }
      case "query-editor-formula": {
        data = img_query_editor_formula;
        break;
      }
      case "query-editor-raw": {
        data = img_query_editor_raw;
        break;
      }
      case "query-editor-application": {
        data = img_query_editor_application;
        break;
      }
      case "query-editor-http": {
        data = img_query_editor_http;
        break;
      }
      case "status-bar-arrow-left": {
        data = img_status_bar_arrow_left;
        break;
      }
      case "status-bar-arrow-right": {
        data = img_status_bar_arrow_right;
        break;
      }
      case "status-bar-sheet": {
        data = img_status_bar_sheet;
        break;
      }
      case "status-bar-blank-canvas": {
        data = img_status_bar_blank_canvas;
        break;
      }
      case "status-bar-graph": {
        data = img_status_bar_graph;
        break;
      }
      case "status-bar-spreadsheet": {
        data = img_status_bar_spreadsheet;
        break;
      }
      case "status-bar-more": {
        data = img_status_bar_more;
        break;
      }
      case "status-bar-dashboard": {
        data = img_status_bar_dashboard;
        break;
      }
      case "status-bar-add-tab": {
        data = img_status_bar_add_tab;
        break;
      }
      case "status-bar-grid": {
        data = img_status_bar_grid;
        break;
      }
      case "status-bar-document": {
        data = img_status_bar_document;
        break;
      }
      case "status-bar-row-horizontal": {
        data = img_status_bar_row_horizontal;
        break;
      }
      case "calendar-pick": {
        data = img_calendar_pick;
        break;
      }
      case "home": {
        data = img_home;
        break;
      }
      case "search": {
        data = img_search;
        break;
      }
      case "search_2": {
        data = img_search_2;
        break;
      }
      case "plus-sign": {
        data = img_plus_sign;
        break;
      }
      case "location": {
        data = img_location;
        break;
      }
      case "tw-database": {
        data = img_tw_database;
        break;
      }
      case "tw-database-folder": {
        data = img_tw_database_folder;
        break;
      }
      case "tw-database-active": {
        data = img_tw_database_active;
        break;
      }
      case "tw-database-inactive": {
        data = img_tw_database_inactive;
        break;
      }
      case "tw-database-empty": {
        data = img_tw_database_empty;
        break;
      }
      case "tw-dbschema": {
        data = img_tw_dbschema;
        break;
      }
      case "tw-dbtable": {
        data = img_tw_dbtable;
        break;
      }
      case "tw-expand-arrow": {
        data = img_tw_expand_arrow;
        break;
      }
      case "tw-column-binary": {
        data = img_tw_column_binary;
        break;
      }
      case "tw-column-boolean": {
        data = img_tw_column_boolean;
        break;
      }
      case "tw-column-date": {
        data = img_tw_column_date;
        break;
      }
      case "tw-column-datetime-arr": {
        data = img_tw_column_datetime_arr;
        break;
      }
      case "tw-column-decimal": {
        data = img_tw_column_decimal;
        break;
      }
      case "tw-column-json": {
        data = img_tw_column_json;
        break;
      }
      case "tw-column-location": {
        data = img_tw_column_location;
        break;
      }
      case "tw-column-number-arr": {
        data = img_tw_column_number_arr;
        break;
      }
      case "tw-column-number": {
        data = img_tw_column_number;
        break;
      }
      case "tw-column-string-arr": {
        data = img_tw_column_string_arr;
        break;
      }
      case "tw-column-string": {
        data = img_tw_column_string;
        break;
      }
      case "tw-column-time": {
        data = img_tw_column_time;
        break;
      }
      case "tw-fsexcel": {
        data = img_tw_fsexcel;
        break;
      }
      case "tw-fscsv": {
        data = img_tw_fscsv;
        break;
      }
      case "tw-fssheet": {
        data = img_tw_fssheet;
        break;
      }
      case "tw-source-csv": {
        data = img_tw_source_csv;
        break;
      }
      case "tw-source-csv-disabled": {
        data = img_tw_source_csv_disabled;
        break;
      }
      case "tw-source-excel": {
        data = img_tw_source_excel;
        break;
      }
      case "tw-source-remote-fs-manager-active": {
        data = img_panel_remote_fs_manager_active;
        break;
      }
      case "tw-source-remote-fs-manager-inactive": {
        data = img_panel_remote_fs_manager_inactive;
        break;
      }
      case "tw-source-toolbar-connect-database": {
        data = img_panel_toolbar_connect_database;
        break;
      }
      case "tw-source-toolbar-connect-server": {
        data = img_panel_toolbar_connect_server;
        break;
      }
      case "tw-source-toolbar-upload-files": {
        data = img_panel_toolbar_upload_files;
        break;
      }
      case "password-invisible": {
        data = img_input_password_invisible;
        break;
      }
      case "password-visible": {
        data = img_input_password_visible;
        break;
      }
      case "navigate-left": {
        data = img_navigate_left;
        break;
      }
      case "navigate-right": {
        data = img_navigate_right;
        break;
      }

      case "object-container": {
        data = img_object_container;
        break;
      }
      case "object-container-tiled": {
        data = img_object_container_tiled;
        break;
      }
      case "object-chart": {
        data = img_object_chart;
        break;
      }
      case "object-image": {
        data = img_object_image;
        break;
      }
      case "object-spreadsheet": {
        data = img_object_spreadsheet;
        break;
      }

      // case "layer-item-grid": {
      //   data = img_layer_item_grid;
      //   break;
      // }
      // case "layer-item-image": {
      //   data = img_layer_item_image;
      //   break;
      // }
      // case "layer-item-slicer": {
      //   data = img_layer_item_slicer;
      //   break;
      // }
      // case "layer-item-chart-bar": {
      //   data = img_layer_item_chart_bar;
      //   break;
      // }
      // case "layer-item-chart-pie": {
      //   data = img_layer_item_chart_pie;
      //   break;
      // }
      case "layers-grid": {
        data = img_layers_grid;
        break;
      }
      case "layers-label-arrow": {
        data = img_layers_label_arrow;
        break;
      }
      case "layers-filters": {
        data = img_layers_filters;
        break;
      }
      case "layers-exapand-collapse": {
        data = img_layers_expand_collapse;
        break;
      }
      case "layers-folder": {
        data = img_layers_folder;
        break;
      }

      case "layer-item-container": {
        data = img_layer_item_container;
        break;
      }
      case "layer-item-spreadsheet": {
        data = img_layer_item_spreadsheet;
        break;
      }
      case "layer-item-chart": {
        data = img_layer_item_chart;
        break;
      }
      case "layer-item-image": {
        data = img_layer_item_image;
        break;
      }

      case "layer-action-group-arrow": {
        data = img_layer_action_group_arrow;
        break;
      }
      case "layer-action-toggle": {
        data = img_layer_action_toggle;
        break;
      }
      case "layer-action-lock": {
        data = img_layer_action_lock;
        break;
      }
      case "layer-action-delete": {
        data = img_layer_action_delete;
        break;
      }

      case "sheet-panel-sticky": {
        data = img_sticky_medium;
        break;
      }
      case "sheet-panel-settings": {
        data = img_settings_medium;
        break;
      }
      case "3-arrows-colored-up": {
        data = img_3_arrows_colored_up;
        break;
      }
      case "3-arrows-colored-right": {
        data = img_3_arrows_colored_right;
        break;
      }
      case "3-arrows-colored-down": {
        data = img_3_arrows_colored_down;
        break;
      }
      case "3-traffic-lights-green": {
        data = img_3_traffic_lights_green;
        break;
      }
      case "3-traffic-lights-yellow": {
        data = img_3_traffic_lights_yellow;
        break;
      }
      case "3-traffic-lights-red": {
        data = img_3_traffic_lights_red;
        break;
      }

      // data type
      case "data-type-array-array": {
        data = img_data_type_array_array;
        break;
      }
      case "data-type-array-array-grayscale": {
        data = img_data_type_array_array_grayscale;
        break;
      }
      case "data-type-binary": {
        data = img_data_type_binary;
        break;
      }
      case "data-type-binary-grayscale": {
        data = img_data_type_binary_grayscale;
        break;
      }
      case "data-type-binary-array": {
        data = img_data_type_binary_array;
        break;
      }
      case "data-type-binary-array-grayscale": {
        data = img_data_type_binary_array_grayscale;
        break;
      }
      case "data-type-boolean": {
        data = img_data_type_boolean;
        break;
      }
      case "data-type-boolean-grayscale": {
        data = img_data_type_boolean_grayscale;
        break;
      }
      case "data-type-boolean-array": {
        data = img_data_type_boolean_array;
        break;
      }
      case "data-type-boolean-array-grayscale": {
        data = img_data_type_boolean_array_grayscale;
        break;
      }
      case "data-type-date": {
        data = img_data_type_date;
        break;
      }
      case "data-type-date-grayscale": {
        data = img_data_type_date_grayscale;
        break;
      }
      case "data-type-date-array": {
        data = img_data_type_date_array;
        break;
      }
      case "data-type-date-array-grayscale": {
        data = img_data_type_date_array_grayscale;
        break;
      }
      case "data-type-datetime": {
        data = img_data_type_datetime;
        break;
      }
      case "data-type-datetime-grayscale": {
        data = img_data_type_datetime_grayscale;
        break;
      }
      case "data-type-datetime-array": {
        data = img_data_type_datetime_array;
        break;
      }
      case "data-type-datetime-array-grayscale": {
        data = img_data_type_datetime_array_grayscale;
        break;
      }
      case "data-type-decimal": {
        data = img_data_type_decimal;
        break;
      }
      case "data-type-decimal-grayscale": {
        data = img_data_type_decimal_grayscale;
        break;
      }
      case "data-type-decimal-array": {
        data = img_data_type_decimal_array;
        break;
      }
      case "data-type-float": {
        data = img_data_type_float;
        break;
      }
      case "data-type-float-grayscale": {
        data = img_data_type_float_grayscale;
        break;
      }
      case "data-type-float-array": {
        data = img_data_type_float_array;
        break;
      }
      case "data-type-float-array-grayscale": {
        data = img_data_type_float_array_grayscale;
        break;
      }
      case "data-type-geography": {
        data = img_data_type_geography;
        break;
      }
      case "data-type-geography-grayscale": {
        data = img_data_type_geography_grayscale;
        break;
      }
      case "data-type-geography-array": {
        data = img_data_type_geography_array;
        break;
      }
      case "data-type-geography-array-grayscale": {
        data = img_data_type_geography_array_grayscale;
        break;
      }
      case "data-type-integer": {
        data = img_data_type_integer;
        break;
      }
      case "data-type-integer-grayscale": {
        data = img_data_type_integer_grayscale;
        break;
      }
      case "data-type-integer-array": {
        data = img_data_type_integer_array;
        break;
      }
      case "data-type-integer-array-grayscale": {
        data = img_data_type_integer_array_grayscale;
        break;
      }
      case "data-type-interval": {
        data = img_data_type_interval;
        break;
      }
      case "data-type-interval-grayscale": {
        data = img_data_type_interval_grayscale;
        break;
      }
      case "data-type-interval-array": {
        data = img_data_type_interval_array;
        break;
      }
      case "data-type-interval-array-grayscale": {
        data = img_data_type_interval_array_grayscale;
        break;
      }
      case "data-type-json": {
        data = img_data_type_json;
        break;
      }
      case "data-type-json-grayscale": {
        data = img_data_type_json_grayscale;
        break;
      }
      case "data-type-json-array": {
        data = img_data_type_json_array;
        break;
      }
      case "data-type-json-array-grayscale": {
        data = img_data_type_json_array_grayscale;
        break;
      }
      case "data-type-string": {
        data = img_data_type_string;
        break;
      }
      case "data-type-string-grayscale": {
        data = img_data_type_string_grayscale;
        break;
      }
      case "data-type-string-array": {
        data = img_data_type_string_array;
        break;
      }
      case "data-type-string-array-grayscale": {
        data = img_data_type_string_array_grayscale;
        break;
      }
      case "data-type-struct": {
        data = img_data_type_struct;
        break;
      }
      case "data-type-struct-grayscale": {
        data = img_data_type_struct_grayscale;
        break;
      }
      case "data-type-struct-array": {
        data = img_data_type_struct_array;
        break;
      }
      case "data-type-struct-array-grayscale": {
        data = img_data_type_struct_array_grayscale;
        break;
      }
      case "data-type-time": {
        data = img_data_type_time;
        break;
      }
      case "data-type-time-grayscale": {
        data = img_data_type_time_grayscale;
        break;
      }
      case "data-type-time-array": {
        data = img_data_type_time_array;
        break;
      }
      case "data-type-time-array-grayscale": {
        data = img_data_type_time_array_grayscale;
        break;
      }
      case "data-type-timestamp": {
        data = img_data_type_timestamp;
        break;
      }
      case "data-type-timestamp-grayscale": {
        data = img_data_type_timestamp_grayscale;
        break;
      }
      case "data-type-timestamp-array": {
        data = img_data_type_timestamp_array;
        break;
      }
      case "data-type-timestamp-array-grayscale": {
        data = img_data_type_timestamp_array_grayscale;
        break;
      }
      case "data-type-variant": {
        data = img_data_type_variant;
        break;
      }
      case "data-type-variant-grayscale": {
        data = img_data_type_variant_grayscale;
        break;
      }
      case "data-type-variant-array": {
        data = img_data_type_variant_array;
        break;
      }
      case "data-type-variant-array-grayscale": {
        data = img_data_type_variant_array_grayscale;
        break;
      }

      // toolbar image
      case "toolbar-image-align-bottom": {
        data = img_toolbar_image_align_bottom;
        break;
      }
      case "toolbar-image-align-left": {
        data = img_toolbar_image_align_left;
        break;
      }
      case "toolbar-image-filter": {
        data = img_toolbar_image_filter;
        break;
      }
      case "toolbar-image-rotate": {
        data = img_toolbar_image_rotate;
        break;
      }

      // currency format
      case "currency-format-dollar": {
        data = img_currency_format_dollar;
        break;
      }
      case "currency-format-euro": {
        data = img_currency_format_euro;
        break;
      }
      case "currency-format-pound": {
        data = img_currency_format_pound;
        break;
      }

      case "dropdown-resize": {
        data = img_dropdown_resize;
        break;
      }

      case "map-layers": {
        data = img_map_layers;
        break;
      }
      case "map-locate": {
        data = img_map_locate;
        break;
      }
      case "map-marker-handle": {
        data = img_map_marker_handle;
        break;
      }
      case "map-zoom-in": {
        data = img_map_zoom_in;
        break;
      }
      case "map-zoom-out": {
        data = img_map_zoom_out;
        break;
      }

      case "filter-add": {
        data = img_filter_add;
        break;
      }
      case "filter-add-advanced": {
        data = img_filter_add_advanced;
        break;
      }
      case "filter-by-color": {
        data = img_filter_by_color;
        break;
      }
      case "filter-clear": {
        data = img_filter_clear;
        break;
      }
      case "filter-delete": {
        data = img_filter_delete;
        break;
      }
      case "filter-group-collapse": {
        data = img_filter_group_collapse;
        break;
      }
      case "filter-group-collapsed": {
        data = img_filter_group_collapsed;
        break;
      }
      case "filter-group-expand": {
        data = img_filter_group_expand;
        break;
      }
      case "filter-search": {
        data = img_filter_search;
        break;
      }
      case "filter-settings": {
        data = img_filter_settings;
        break;
      }
      case "filter-state-disable": {
        data = img_filter_state_disable;
        break;
      }
      case "filter-state-enable": {
        data = img_filter_state_enable;
        break;
      }

      case "sort-by-color": {
        data = img_sort_by_color;
        break;
      }
      case "sort-text-ascending": {
        data = img_sort_text_ascending;
        break;
      }
      case "sort-text-descending": {
        data = img_sort_text_descending;
        break;
      }
      case "sort-tick-sign": {
        data = img_sort_tick_sign;
        break;
      }
      case "table-column-style": {
        data = img_table_column_style;
        break;
      }
      case "table-summary-collapse": {
        data = img_table_summary_collapse;
        break;
      }
      case "table-summary-expand": {
        data = img_table_summary_expand;
        break;
      }
      case "table-row-style": {
        data = img_table_row_style;
        break;
      }
      case "text-rotation-button": {
        // This one is used for toolbar button
        data = img_text_rotation_angleup;
        break;
      }
      case "text-rotation-none": {
        data = img_text_rotation_none;
        break;
      }
      case "text-rotation-rotate-down": {
        data = img_text_rotation_rotate_down;
        break;
      }
      case "text-rotation-rotate-up": {
        data = img_text_rotation_rotate_up;
        break;
      }
      case "text-rotation-stack-vertically": {
        data = img_text_rotation_stack_vertically;
        break;
      }
      case "text-rotation-tilt-down": {
        data = img_text_rotation_tilt_down;
        break;
      }
      case "text-rotation-tilt-up": {
        data = img_text_rotation_tilt_up;
        break;
      }
      case "hyperlink": {
        data = img_hyperlink;
        break;
      }
      case "hyperlink-edit": {
        data = img_hyperlink_edit;
        break;
      }
      case "hyperlink-remove": {
        data = img_hyperlink_remove;
        break;
      }
      case "hyperlink-favicon": {
        data = img_hyperlink_favicon;
        break;
      }
      case "panel-add-folder": {
        data = img_panel_add_folder;
        break;
      }
      case "panel-edit-database": {
        data = img_panel_edit_database;
        break;
      }
      case "panel-file": {
        data = img_panel_file;
        break;
      }
      case "panel-folder": {
        data = img_panel_folder;
        break;
      }
      case "panel-sort": {
        data = img_panel_sort;
        break;
      }
      case "panel-more": {
        data = img_panel_more;
        break;
      }
      case "panel-search": {
        data = img_panel_search;
        break;
      }
      case "panel-search-clear": {
        data = img_panel_search_clear;
        break;
      }
      case "panel-breadcrumb-separator": {
        data = img_panel_breadcrumb_separator;
        break;
      }
      case "panel-breadcrumb-slash-separator": {
        data = img_panel_breadcrumb_slash_separator;
        break;
      }
      case "panel-breadcrumb-home": {
        data = img_panel_breadcrumb_home;
        break;
      }
      case "panel-reload": {
        data = img_icon_reload;
        break;
      }
      // key icons
      case "key-c": {
        data = img_key_c;
        break;
      }
      case "key-cmd": {
        data = img_key_cmd;
        break;
      }
      case "key-shift": {
        data = img_key_shift;
        break;
      }
      case "key-v": {
        data = img_key_v;
        break;
      }
      case "key-x": {
        data = img_key_x;
        break;
      }
      case "key-z": {
        data = img_key_z;
        break;
      }
      case "panel-breadcrumb-back": {
        data = img_panel_breadcrumb_back;
        break;
      }
      case "panel-breadcrumb-expand": {
        data = img_panel_breadcrumb_expand;
        break;
      }
      case "panel-close": {
        data = img_panel_close;
        break;
      }
      case "panel-uitable": {
        data = img_panel_uitable;
        break;
      }
      case "panel-dbtable": {
        data = img_panel_dbtable;
        break;
      }
      case "edit-cut": {
        data = img_cut;
        break;
      }
      case "hyperlink-copy":
      case "edit-copy": {
        data = img_copy;
        break;
      }
      case "edit-paste": {
        data = img_paste;
        break;
      }
      case "edit-clear": {
        data = img_clear;
        break;
      }
      case "edit-delete": {
        data = img_delete;
        break;
      }
      case "new-datadocs": {
        data = img_new_datadocs;
        break;
      }
      case "open-datadocs": {
        data = img_open_datadocs;
        break;
      }
      case "import": {
        data = img_import;
        break;
      }
      default:
        break;
    }

    viewBox = extractViewBox(data);
  }

  $: elements = data.replace(/<svg ([^>]*)>/, "").replace("</svg>", "");

  $: firstLetter = icon?.charAt(0);
</script>

{#if data !== ""}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    bind:this={svg}
    {width}
    {height}
    {viewBox}
    {stroke}
    {fill}
    {...$$restProps}
    class={className}
    on:click
  >
    {@html elements}
  </svg>
{:else if firstLetter !== undefined}
  <Fa icon={faBorderStyle} size="lg" class="inline-block" color={fill} />
{/if}
