The present tutorial describes the step by step process to configure Thunderbird to work with OpenPaaS.

## Warning

In order to ensure all its functionnalities, the OpenPaaS add-on for Thunderbird uses two other add-ons:

* Lightning to manage calendars (installed by default since Thunderbird 60)
* Cardbook to manage address books.

The OpenPaaS add-on for Thunderbird will install these itself if they were to be missing beforehand.

Please do not deactivate or uninstall them.

## Prerequisite

Download the [OpenPaaS add-on for Thunderbird](/sync/downloads/thunderbird/op-tb-autoconf.xpi) and save it to your computer.

## Installation and configuration

If you never configured any email address before, Thunderbird will show the following screen upon startup.

    ![create_address](/sync/images/en/thunderbird_create_address.png)

Click `Cancel`.

Click on the menu icon as shown below.

    ![open_menu](/sync/images/en/thunderbird_open_menu.png)

Then click on `Add-ons`.

In the add-ons management screen, click `Extensions` in the left column and then on the gear icon.

    ![modules_menu](/sync/images/en/thunderbird_modules_menu.png)

Finally, click on `Install Add-on From File...` to select the OpenPaaS add-on file you previously downloaded. On the next screen, wait for the `Install` button countdown to reach zero. Then click on `Install Now`.

    ![install_countdown](/sync/images/en/thunderbird_install_now.png)

Thunderbird will need to restar. Click `Restart now`.

Upon startup, the following window will ask for your OpenPaaS login and password.

    ![enter_account](/sync/images/en/thunderbird_enter_account.png)

Thunderbird starts and asks again if you want to configure an existing email address. Click `Cancel`. The software will undergo a second restart, asking for your OpenPaaS login and password again. Please note that you can now click the `Save your credentials` tickbox to avoid having to enter them again.

You will notice in the add-ons management screen that the Lightning and Cardbook add-ons have been installed if they were not.

Your emails, calendars and address books are now being synchronized and will be accessible shortly.
