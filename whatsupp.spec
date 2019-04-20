
%define        __spec_install_post %{nil}
%define          debug_package %{nil}
%define        __os_install_post %{_dbpath}/brp-compress

Summary:   WhatsUpp
Name:      WhatsUpp
Version:   0.5.1
Release:   1
License:   GPL
Group:     None
Packager:  alindt <whatsupp@cevreau.eu>
BuildArchitectures: x86_64
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}-root
Source:    dummy.tar.bz2
Requires:  libXScrnSaver
Provides:  libffmpeg.so()(64bit)

%description
Native desktop app/wrapper for https://web.whatsapp.com. Built with Electron.

%prep
%setup -c -q -T -D -a 0

%build
# Empty section.

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}
mkdir -p %{buildroot}/usr/share/applications/
mkdir -p %{buildroot}/usr/share/metainfo/
mkdir -p %{buildroot}/usr/share/icons/hicolor/128x128/apps/
mkdir -p %{buildroot}/usr/share/icons/hicolor/64x64/apps/
cp "%{_topdir}/../app/assets/icon/icon@2x.png" %{buildroot}/usr/share/icons/hicolor/128x128/apps/whatsupp.png
cp "%{_topdir}/../app/assets/icon/icon.png" %{buildroot}/usr/share/icons/hicolor/64x64/apps/whatsupp.png
cp %{_topdir}/../whatsupp.desktop %{buildroot}/usr/share/applications/
cp %{_topdir}/../eu.alindt.whatsupp.appdata.xml %{buildroot}/usr/share/metainfo/
# copy files in builddir
install -d -m 0755 %{buildroot}/opt/whatsupp/
install -d -m 0755 %{buildroot}/%{_bindir}
cp -ar %{_topdir}/../dist/WhatsUpp-linux-x64/* %{buildroot}/opt/whatsupp/
ln -sf /opt/whatsupp/WhatsUpp %{buildroot}/%{_bindir}/WhatsUpp

%clean
rm -rf %{buildroot}


%files
%defattr(-,root,root,-)
/opt/whatsupp/*
%{_bindir}/WhatsUpp
/usr/share/applications/whatsupp.desktop
/usr/share/metainfo/eu.alindt.whatsupp.appdata.xml
/usr/share/icons/hicolor/128x128/apps/whatsupp.png
/usr/share/icons/hicolor/64x64/apps/whatsupp.png

%changelog
* Sun Apr 21 2018  alindt <whatsupp@cevreau.eu> 0.5.1-1
- See debian changelog in repo

* Sat Mar 31 2018  Enrico204 <enrico204@gmail.com> 0.5.0-1
- See debian changelog in repo

* Wed Jan 03 2018  Enrico204 <enrico204@gmail.com> 0.4.2-1
- See debian changelog on repo

* Tue Jan 02 2018  Enrico204 <enrico204@gmail.com> 0.4.1-1
- See debian changelog on repo

* Sun Dec 31 2017  Enrico204 <enrico204@gmail.com> 0.4.0-1
- See debian changelog on repo

* Sat Nov 04 2017  Enrico204 <enrico204@gmail.com> 0.3.14-1
- See debian changelog on repo

* Mon Aug 28 2017  Enrico204 <enrico204@gmail.com> 0.3.13-1
- See debian changelog on repo

* Thu Aug  3 2017  Enrico204 <enrico204@gmail.com> 0.3.12-1
- First Build
