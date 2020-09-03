import { renderWithWrappers } from "lib/tests/renderWithWrappers"
import React from "react"
import "react-native"
import { Linking } from "react-native"

import AttachmentPreview from "../AttachmentPreview"
import FileDownload from "../FileDownload"

Linking.openURL = jest.fn()
it("opens file url when it is selected", async () => {
  const component = renderWithWrappers(<FileDownload attachment={attachment as any} />)
  component.root.findByType(AttachmentPreview).props.onSelected()
  expect(Linking.openURL).toBeCalledWith(attachment.downloadURL)
})

const attachment = {
  id: "cats",
  fileName: "This is a great ZIP file telling you all about cats",
  downloadURL: "http://example.com/cats.zip",
}
