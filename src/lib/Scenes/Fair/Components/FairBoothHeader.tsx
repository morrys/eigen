import { FairBoothHeader_show } from "__generated__/FairBoothHeader_show.graphql"
import { FairBoothHeaderMutation } from "__generated__/FairBoothHeaderMutation.graphql"
import { Schema, Track, track as _track } from "lib/utils/track"
import { Box, Button, Sans, Serif, Spacer } from "palette"
import React from "react"
import { TouchableOpacity } from "react-native"
import { commitMutation, createFragmentContainer, graphql, RelayProp } from "react-relay"

interface Props {
  show: FairBoothHeader_show
  onTitlePressed: (id: string) => void
  relay: RelayProp
}

interface State {
  isFollowedChanging: boolean
}

// @ts-ignore STRICTNESS_MIGRATION
const formatCounts = ({ artists, artworks }) => {
  const artistLabel = artists === 1 ? "artist" : "artists"
  const worksLabel = artworks === 1 ? "work" : "works"
  return `${artworks} ${worksLabel} by ${artists} ${artistLabel}`
}

// @ts-ignore STRICTNESS_MIGRATION
const track: Track<Props, State> = _track

@track()
export class FairBoothHeader extends React.Component<Props, State> {
  state = {
    isFollowedChanging: false,
  }
  @track((props, _, args) => {
    const partnerSlug = args[0]
    const partnerID = args[1]
    const partnerFollowed = props.show.partner?.profile?.is_followed
    const actionName = partnerFollowed ? Schema.ActionNames.GalleryFollow : Schema.ActionNames.GalleryUnfollow
    return {
      action_name: actionName,
      action_type: Schema.ActionTypes.Success,
      owner_id: partnerID,
      owner_slug: partnerSlug,
      owner_type: Schema.OwnerEntityTypes.Gallery,
    } as any
  })
  // @ts-ignore STRICTNESS_MIGRATION
  trackFollowPartner(_partnerSlug, _partnerID) {
    return null
  }

  handleFollowPartner = () => {
    const { show, relay } = this.props
    const {
      partner: {
        // @ts-ignore STRICTNESS_MIGRATION
        slug: partnerSlug,
        // @ts-ignore STRICTNESS_MIGRATION
        internalID: partnerID,
        // @ts-ignore STRICTNESS_MIGRATION
        id: partnerRelayID,
      },
    } = show
    const { is_followed: partnerFollowed, internalID: profileID } = show.partner?.profile || {}

    if (!profileID || !partnerFollowed) {
      return
    }

    this.setState(
      {
        isFollowedChanging: true,
      },
      () => {
        commitMutation<FairBoothHeaderMutation>(relay.environment, {
          onCompleted: () => {
            this.setState({
              isFollowedChanging: false,
            })
            this.trackFollowPartner(partnerSlug, partnerID)
          },
          mutation: graphql`
            mutation FairBoothHeaderMutation($input: FollowProfileInput!) {
              followProfile(input: $input) {
                profile {
                  slug
                  internalID
                  is_followed: isFollowed
                }
              }
            }
          `,
          variables: {
            input: {
              profileID,
              unfollow: partnerFollowed,
            },
          },
          optimisticResponse: {
            followProfile: {
              profile: {
                internalID: profileID,
                slug: partnerSlug,
                is_followed: !partnerFollowed,
              },
            },
          },
          updater: store => {
            // @ts-ignore STRICTNESS_MIGRATION
            store.get(partnerRelayID).setValue(!partnerFollowed, "is_followed")
          },
        })
      }
    )
  }

  render() {
    const { show, onTitlePressed } = this.props
    const {
      partner: {
        // @ts-ignore STRICTNESS_MIGRATION
        name: partnerName,
        // @ts-ignore STRICTNESS_MIGRATION
        href: partnerHref,
      },
      // @ts-ignore STRICTNESS_MIGRATION
      fair: { name: fairName },
      // @ts-ignore STRICTNESS_MIGRATION
      location: { display: boothLocation },
      counts,
    } = show
    const partnerFollowed = show.partner?.profile?.is_followed
    const { isFollowedChanging } = this.state

    return (
      <Box pt={12} px={2}>
        <TouchableOpacity onPress={() => onTitlePressed(partnerHref)}>
          <Serif size="8">{partnerName}</Serif>
        </TouchableOpacity>
        <Spacer m={0.3} />
        <Sans weight="medium" size="3t">
          {fairName}
        </Sans>
        <Spacer m={0.5} />
        {!!boothLocation && (
          <>
            <Serif size="3t">{boothLocation}</Serif>
            <Spacer m={0.3} />
          </>
        )}
        <Sans size="3t" color="black60">
          {formatCounts(
            // @ts-ignore STRICTNESS_MIGRATION
            counts
          )}
        </Sans>
        {!!show.partner?.profile && (
          <>
            <Spacer m={3} />
            <Spacer m={1} />
            <Button
              loading={isFollowedChanging}
              onPress={this.handleFollowPartner}
              width={100}
              block
              variant={partnerFollowed ? "secondaryOutline" : "primaryBlack"}
            >
              {partnerFollowed ? "Following gallery" : "Follow gallery"}
            </Button>
            <Spacer m={1} />
          </>
        )}
      </Box>
    )
  }
}

export const FairBoothHeaderContainer = createFragmentContainer(FairBoothHeader, {
  show: graphql`
    fragment FairBoothHeader_show on Show {
      fair {
        name
      }
      partner {
        ... on Partner {
          name
          slug
          internalID
          id
          href
          profile {
            internalID
            slug
            is_followed: isFollowed
          }
        }
      }
      counts {
        artworks
        artists
      }
      location {
        display
      }
    }
  `,
})
