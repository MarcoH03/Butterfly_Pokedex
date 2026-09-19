#!/usr/bin/env ruby
# Genera MariposasDeCuba.xcodeproj a partir de los fuentes en
# MariposasDeCuba/. Se ejecuta en cualquier máquina con Ruby (no
# hace falta macOS ni Xcode para GENERAR el .xcodeproj — solo para
# compilarlo después con xcodebuild).
require 'xcodeproj'

ROOT = File.expand_path(__dir__)
APP_DIR = File.join(ROOT, 'MariposasDeCuba')
PROJECT_PATH = File.join(ROOT, 'MariposasDeCuba.xcodeproj')
BUNDLE_ID = 'com.marcoh03.mariposasdecuba'

project = Xcodeproj::Project.new(PROJECT_PATH)

target = project.new_target(:application, 'MariposasDeCuba', :ios, '17.0')

# ── Grupos, en el mismo orden que las carpetas ──
root_group = project.main_group.new_group('MariposasDeCuba', APP_DIR)

def add_swift_files(project, target, group, dir)
  Dir.children(dir).sort.each do |entry|
    path = File.join(dir, entry)
    if File.directory?(path)
      next if entry.end_with?('.xcassets')
      sub_group = group.new_group(entry, path)
      add_swift_files(project, target, sub_group, path)
    elsif entry.end_with?('.swift')
      file_ref = group.new_file(path)
      target.add_file_references([file_ref])
    end
  end
end

add_swift_files(project, target, root_group, APP_DIR)

# ── Info.plist (referenciado, no compilado como recurso) ──
info_plist_ref = root_group.find_subpath('App').new_file(File.join(APP_DIR, 'App', 'Info.plist')) rescue nil

# ── Recursos: Assets.xcassets y los dos JSON del catálogo ──
resources_group = root_group.new_group('Resources', File.join(APP_DIR, 'Resources'))
%w[especies.json zonas.json].each do |name|
  ref = resources_group.new_file(File.join(APP_DIR, 'Resources', name))
  target.add_resources([ref])
end

assets_ref = root_group.new_file(File.join(APP_DIR, 'Assets.xcassets'))
target.add_resources([assets_ref])

# ── Ajustes de compilación ──
target.build_configurations.each do |config|
  settings = config.build_settings
  settings['PRODUCT_BUNDLE_IDENTIFIER'] = BUNDLE_ID
  settings['PRODUCT_NAME'] = 'Mariposas de Cuba'
  settings['INFOPLIST_FILE'] = 'MariposasDeCuba/App/Info.plist'
  settings['SWIFT_VERSION'] = '5.0'
  settings['IPHONEOS_DEPLOYMENT_TARGET'] = '17.0'
  settings['TARGETED_DEVICE_FAMILY'] = '1'
  settings['ASSETCATALOG_COMPILER_APPICON_NAME'] = 'AppIcon'
  settings['ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME'] = 'AccentColor'
  settings['GENERATE_INFOPLIST_FILE'] = 'NO'
  settings['CODE_SIGN_STYLE'] = 'Automatic'
  settings['CURRENT_PROJECT_VERSION'] = '1'
  settings['MARKETING_VERSION'] = '1.0'
  settings['SUPPORTS_MACCATALYST'] = 'NO'
  settings['SUPPORTED_PLATFORMS'] = 'iphoneos iphonesimulator'
  settings['ENABLE_PREVIEWS'] = 'YES'
  settings['DEVELOPMENT_TEAM'] = ''
end

# ── Esquema compartido, para que xcodebuild -scheme funcione en CI
#    y para que cualquiera que abra el proyecto en Xcode vea el botón
#    de Run ya listo, sin configurarlo a mano. ──
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(target)
scheme.set_launch_target(target)
scheme.save_as(PROJECT_PATH, 'MariposasDeCuba', true)

project.save
puts "Proyecto generado en #{PROJECT_PATH}"
